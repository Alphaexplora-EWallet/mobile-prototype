import { describe, expect, it } from "vitest";
import type { PaymentIntent, TransferIntent } from "@/core/domain/paymentIntent";
import type { Recipient } from "@/core/domain/payments";
import type { TransferRail } from "@/core/domain/rails";
import { NO_CONFIRMATION_REQUIRED } from "@/core/domain/security";
import { MOCK_TRANSACTION_PIN } from "@/core/data/mock/security.mock";
import { pesos } from "@/core/money/money";
import { createMockNetBankGateway, MOCK_RETURNING_SUFFIX } from "./createMockNetBankGateway";

/**
 * The adapter's own tests. Before this, `TransactionStatus`'s `pending` and
 * `failed` members and every error branch in the ViewModels were unreachable:
 * the mock had no failure path and always answered `completed`. These are the
 * evidence that those states now happen.
 */

const recipient = (bankCode: string, accountNumber: string): Recipient => ({
  id: `r-${accountNumber}`,
  initials: "TT",
  name: "Test Target",
  handle: `•••• ${accountNumber.slice(-4)}`,
  accountNumber,
  bankCode,
});

const transfer = (rail: TransferRail, amount: number, target = recipient("BDO", "003812340001")): TransferIntent => ({
  kind: "transfer",
  sourceCardId: "main",
  sourceLabel: "Main wallet •••• 8421",
  recipient: rail === "internal" ? recipient("FINA", "9017234471") : target,
  rail,
  amount: pesos(amount),
  note: "",
});

const unwrap = <T>(result: { ok: true; value: T } | { ok: false; error: { code: string; message: string } }): T => {
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}: ${result.error.message}`);
  return result.value;
};

const errorOf = (result: { ok: boolean } & Record<string, unknown>): string =>
  result.ok ? "expected a failure" : ((result.error as { code: string }).code ?? "unknown");

/** Confirms an intent that steps up, returning the token `submit` needs. */
const confirmWithPin = async (gateway: ReturnType<typeof createMockNetBankGateway>) =>
  unwrap(await gateway.security.verifyPin(MOCK_TRANSACTION_PIN));

const submit = async (gateway: ReturnType<typeof createMockNetBankGateway>, intent: PaymentIntent, token: string) =>
  gateway.payments.submit(intent, gateway.nextIdempotencyKey(), token);

describe("mock NetBank gateway", () => {
  it("quotes each rail with its real fee and settlement promise", async () => {
    const gateway = createMockNetBankGateway({ kycTier: "full" });

    const internal = unwrap(await gateway.payments.quote(transfer("internal", 500)));
    expect(internal.fee).toEqual(pesos(0));
    expect(internal.settlesLater).toBe(false);
    expect(internal.arrivalLabel).toBe("Arrives instantly to FIN-A wallets");

    const instapay = unwrap(await gateway.payments.quote(transfer("instapay", 500)));
    expect(instapay.fee).toEqual(pesos(15));
    expect(instapay.total).toEqual(pesos(515));
    expect(instapay.limitLabel).toContain("₱50,000");

    const pesonet = unwrap(await gateway.payments.quote(transfer("pesonet", 500)));
    expect(pesonet.fee).toEqual(pesos(25));
    expect(pesonet.settlesLater).toBe(true);
    expect(pesonet.cutoffLabel).toContain("3:00 PM");
  });

  it("refuses more than the wallet holds", async () => {
    const gateway = createMockNetBankGateway();
    // The main wallet holds ₱24,680.50.
    const result = await gateway.payments.quote(transfer("internal", 30_000));
    expect(errorOf(result)).toBe("insufficient-funds");
  });

  it("enforces the InstaPay per-transaction cap", async () => {
    const gateway = createMockNetBankGateway({ kycTier: "full" });
    const result = await gateway.payments.quote(transfer("instapay", 60_000));
    expect(errorOf(result)).toBe("limit-exceeded");
  });

  it("gates PESONet behind full verification", async () => {
    const verified = createMockNetBankGateway({ kycTier: "verified" });
    expect(errorOf(await verified.payments.quote(transfer("pesonet", 500)))).toBe("kyc-required");

    const full = createMockNetBankGateway({ kycTier: "full" });
    expect(unwrap(await full.payments.quote(transfer("pesonet", 500))).rail).toBe("pesonet");
  });

  it("requires a confirmation factor for money leaving the FIN-A ledger", async () => {
    const gateway = createMockNetBankGateway({ kycTier: "full" });

    const unconfirmed = await submit(gateway, transfer("instapay", 500), NO_CONFIRMATION_REQUIRED);
    expect(errorOf(unconfirmed)).toBe("confirmation-required");

    expect(errorOf(await gateway.security.verifyPin("000000"))).toBe("invalid-account");

    const receipt = unwrap(await submit(gateway, transfer("instapay", 500), await confirmWithPin(gateway)));
    expect(receipt.reference).toBe("NBK-TRF-000001");
    expect(receipt.status).toBe("completed");
  });

  it("moves an internal transfer without stepping up, and debits the balance", async () => {
    const gateway = createMockNetBankGateway();

    const receipt = unwrap(await submit(gateway, transfer("internal", 500), NO_CONFIRMATION_REQUIRED));
    expect(receipt.status).toBe("completed");
    expect(receipt.fee).toEqual(pesos(0));

    const accounts = unwrap(await gateway.accounts.list());
    expect(accounts.find((account) => account.cardId === "main")?.balance).toEqual(pesos(24_180.5));
  });

  it("settles a PESONet transfer from pending to completed", async () => {
    const gateway = createMockNetBankGateway({ kycTier: "full", settleAfterPolls: 2 });

    const receipt = unwrap(await submit(gateway, transfer("pesonet", 1_000), await confirmWithPin(gateway)));
    expect(receipt.status).toBe("pending");

    expect(unwrap(await gateway.payments.status(receipt.id)).status).toBe("pending");
    expect(unwrap(await gateway.payments.status(receipt.id)).status).toBe("completed");
  });

  it("returns a PESONet transfer the beneficiary bank rejects, and refunds it", async () => {
    const gateway = createMockNetBankGateway({ kycTier: "full", settleAfterPolls: 1 });
    const rejected = recipient("BDO", `00381234${MOCK_RETURNING_SUFFIX}`);

    const receipt = unwrap(await submit(gateway, transfer("pesonet", 1_000, rejected), await confirmWithPin(gateway)));
    expect(receipt.status).toBe("pending");

    const settled = unwrap(await gateway.payments.status(receipt.id));
    expect(settled.status).toBe("returned");

    // ₱1,000 plus the ₱25 fee come back, so the balance is whole again.
    const accounts = unwrap(await gateway.accounts.list());
    expect(accounts.find((account) => account.cardId === "main")?.balance).toEqual(pesos(24_680.5));
  });

  it("replays a repeated idempotency key instead of paying twice", async () => {
    const gateway = createMockNetBankGateway();
    const intent = transfer("internal", 500);
    const key = gateway.nextIdempotencyKey();

    const first = unwrap(await gateway.payments.submit(intent, key, NO_CONFIRMATION_REQUIRED));
    const second = unwrap(await gateway.payments.submit(intent, key, NO_CONFIRMATION_REQUIRED));

    expect(second.reference).toBe(first.reference);
    const accounts = unwrap(await gateway.accounts.list());
    expect(accounts.find((account) => account.cardId === "main")?.balance).toEqual(pesos(24_180.5));
  });

  it("answers an account name inquiry and rejects a malformed number", async () => {
    const gateway = createMockNetBankGateway();

    expect(unwrap(await gateway.directory.verifyAccountName("FINA", "9017234471")).accountName).toBe("JOMAR D.");
    expect(errorOf(await gateway.directory.verifyAccountName("BDO", "123"))).toBe("invalid-account");
  });

  it("answers a mobile name inquiry, and blocks unregistered or malformed numbers", async () => {
    const gateway = createMockNetBankGateway();

    // Mira S. and Kuya Lito are the fixtures keyed by an 09-prefixed number.
    expect(unwrap(await gateway.directory.lookupMobileName("09174562288")).accountName).toBe("MIRA S.");
    expect(unwrap(await gateway.directory.lookupMobileName("09986541140")).phoneNumber).toBe("09986541140");

    // A well-formed number no FIN-A wallet is registered to is blocked, not guessed.
    expect(errorOf(await gateway.directory.lookupMobileName("09171234567"))).toBe("not-found");

    // Garbage never reaches the registry.
    expect(errorOf(await gateway.directory.lookupMobileName("12345"))).toBe("invalid-account");
    expect(errorOf(await gateway.directory.lookupMobileName("0917ABC2288"))).toBe("invalid-account");
  });

  it("decodes a seeded QR PH code and rejects anything else", async () => {
    const gateway = createMockNetBankGateway();

    const instruction = unwrap(await gateway.payments.decodeQr("DB-2026-0814"));
    expect(instruction.merchantName).toBe("Daily Brew");
    expect(instruction.amount).toEqual(pesos(185));

    expect(errorOf(await gateway.payments.decodeQr("not a qr code"))).toBe("invalid-account");
  });

  it("surfaces an injected failure so the screens' error states are reachable", async () => {
    const gateway = createMockNetBankGateway({ failures: { "activity.list": "network" } });
    const result = await gateway.activity.list();
    expect(errorOf(result)).toBe("network");
  });

  it("filters and pages activity", async () => {
    const gateway = createMockNetBankGateway();

    const firstPage = unwrap(await gateway.activity.list({ limit: 2 }));
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.nextCursor).toBe("2");

    const lastPage = unwrap(await gateway.activity.list({ cursor: firstPage.nextCursor, limit: 2 }));
    expect(lastPage.items).toHaveLength(1);
    expect(lastPage.nextCursor).toBeUndefined();

    const searched = unwrap(await gateway.activity.list({ search: "freshmart" }));
    expect(searched.items.map((item) => item.name)).toEqual(["FreshMart"]);
  });

  it("promotes the KYC tier once a complete submission is reviewed", async () => {
    const gateway = createMockNetBankGateway({ kycTier: "verified" });

    expect(errorOf(await gateway.accounts.statements())).toBe("kyc-required");
    expect(
      errorOf(
        await gateway.compliance.submitKyc({
          documentType: "philsys",
          frontCaptured: true,
          backCaptured: true,
          selfieCaptured: false,
          addressLine: "12 Mabini St",
          city: "Quezon City",
          postalCode: "1100",
        }),
      ),
    ).toBe("invalid-account");

    const promoted = unwrap(
      await gateway.compliance.submitKyc({
        documentType: "philsys",
        frontCaptured: true,
        backCaptured: true,
        selfieCaptured: true,
        addressLine: "12 Mabini St",
        city: "Quezon City",
        postalCode: "1100",
      }),
    );
    expect(promoted.tier).toBe("full");
    expect(unwrap(await gateway.accounts.statements())).not.toHaveLength(0);
    expect(unwrap(await gateway.compliance.limits()).rails.find((rail) => rail.rail === "pesonet")?.available).toBe(
      true,
    );
  });

  it("reports a seeded rejection and clears it when the resubmission is reviewed", async () => {
    const gateway = createMockNetBankGateway({
      kycTier: "verified",
      kycRejection: { reason: "Blurry ID photo", stepIndex: 1 },
    });

    const rejected = unwrap(await gateway.compliance.kycStatus());
    expect(rejected.state).toBe("rejected");
    expect(rejected.reviewNote).toBe("Blurry ID photo");
    expect(rejected.rejectedStepIndex).toBe(1);

    const resubmitted = unwrap(
      await gateway.compliance.submitKyc({
        documentType: "philsys",
        frontCaptured: true,
        backCaptured: true,
        selfieCaptured: true,
        addressLine: "12 Mabini St",
        city: "Quezon City",
        postalCode: "1100",
      }),
    );
    expect(resubmitted.state).toBe("approved");
    expect(resubmitted.tier).toBe("full");
    expect(resubmitted.reviewNote).toBeUndefined();
    expect(resubmitted.rejectedStepIndex).toBeUndefined();
  });

  it("clears a rejection at the top tier without promoting past it", async () => {
    const gateway = createMockNetBankGateway({
      kycTier: "full",
      kycRejection: { reason: "Unreadable ID photo", stepIndex: 1 },
    });

    const resubmitted = unwrap(
      await gateway.compliance.submitKyc({
        documentType: "philsys",
        frontCaptured: true,
        backCaptured: true,
        selfieCaptured: true,
        addressLine: "12 Mabini St",
        city: "Quezon City",
        postalCode: "1100",
      }),
    );
    expect(resubmitted.state).toBe("approved");
    expect(resubmitted.tier).toBe("full");
    expect(resubmitted.reviewNote).toBeUndefined();
    expect(resubmitted.rejectedStepIndex).toBeUndefined();
  });
});
