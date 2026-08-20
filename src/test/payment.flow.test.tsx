import { describe, expect, it } from "vitest";
import { press, renderApp as start, type TestUser } from "@/test/helpers/renderApp";
import { screen, within } from "@testing-library/react";
import { MOCK_TRANSACTION_PIN } from "@/core/data/mock/security.mock";

/**
 * The interbank send flow, which had no screens at all: choosing a bank, an
 * account number, the name inquiry that catches a typo, a rail with a real fee,
 * and a confirmation factor before anything leaves.
 *
 * These are new `it` blocks in their own file rather than additions to
 * `app.flow.test.tsx` — the golden snapshot there is evidence about the
 * pre-restructure app and must not grow.
 */

/** Onboards to Home, opens Send, and continues past Step 1 with an amount typed in. */
const openTransfer = async (user: TestUser, amount: string) => {
  await press(user, /^Send$/);
  // Step 1 "Send to": the default recipient is already selected.
  await press(user, /^Continue$/);
  await user.type(screen.getByRole("textbox", { name: /Amount to send/i }), amount);
};

/** Onboards to Home and opens Send, stopping at Step 1 "Send to". */
const openSendStep1 = async (user: TestUser) => {
  await press(user, /^Send$/);
};

/**
 * Walks Send → recipients → bank destination, stopping before the rail choice.
 * The amount is typed on the destination screen's own Amount field — the same
 * `transfer.store.ts` value the Step 2 field would edit, just entered before
 * ever reaching Step 2, since "add a new recipient" branches off Step 1.
 */
const openBankDestination = async (user: TestUser, amount: string, accountNumber: string) => {
  await openSendStep1(user);
  await press(user, /Add recipient/i);
  await press(user, /Send to a bank account/i);
  await press(user, /BDO Unibank/i);
  await user.type(screen.getByRole("textbox", { name: /Amount to send/i }), amount);
  await user.type(screen.getByRole("textbox", { name: /Account number/i }), accountNumber);
  await press(user, /Check account name/i);
};

describe("interbank transfer flow", () => {
  it("sends over InstaPay after a name inquiry and a PIN", async () => {
    const user = start();
    await openBankDestination(user, "500", "003812340001");

    // The inquiry has to answer before a rail can be chosen.
    expect(await screen.findByText(/Is that right\?/i)).toBeTruthy();

    await press(user, /InstaPay/i);
    await press(user, /^Continue$/);

    expect(await screen.findByText("Review transfer")).toBeTruthy();
    const summary = screen.getByRole("region", { name: /Payment summary/i });
    expect(within(summary).getByText("₱15.00")).toBeTruthy();
    expect(within(summary).getByText("₱515.00")).toBeTruthy();
    expect(within(summary).getByText("InstaPay")).toBeTruthy();

    // Money leaving the FIN-A ledger steps up rather than sending straight away.
    await press(user, /Continue to confirm/i);
    await user.type(screen.getByLabelText(/Transaction PIN/i), MOCK_TRANSACTION_PIN);
    await press(user, /Confirm payment/i);

    expect(await screen.findByRole("heading", { name: /Transfer complete/i })).toBeTruthy();
    expect(screen.getByText(/NBK-TRF-000001/)).toBeTruthy();
  });

  it("refuses a wrong PIN and does not send", async () => {
    const user = start();
    await openBankDestination(user, "500", "003812340001");
    expect(await screen.findByText(/Is that right\?/i)).toBeTruthy();
    await press(user, /InstaPay/i);
    await press(user, /^Continue$/);
    await press(user, /Continue to confirm/i);

    await user.type(screen.getByLabelText(/Transaction PIN/i), "000000");
    await press(user, /Confirm payment/i);

    expect(await screen.findByRole("alert")).toHaveTextContent(/PIN is not right/i);
    expect(screen.queryByRole("heading", { name: /Transfer complete/i })).toBeNull();
  });

  it("rejects a malformed account number at the inquiry", async () => {
    const user = start();
    await openSendStep1(user);
    await press(user, /Add recipient/i);
    await press(user, /Send to a bank account/i);
    await press(user, /BDO Unibank/i);
    await user.type(screen.getByRole("textbox", { name: /Amount to send/i }), "500");
    await user.type(screen.getByRole("textbox", { name: /Account number/i }), "123");
    await press(user, /Check account name/i);

    expect(await screen.findByRole("alert")).toHaveTextContent(/does not look right/i);
    expect(screen.queryByText(/Is that right\?/i)).toBeNull();
  });

  it("blocks an InstaPay transfer over the per-transaction cap", async () => {
    const user = start();
    await openBankDestination(user, "60000", "003812340001");
    expect(await screen.findByText(/Is that right\?/i)).toBeTruthy();
    await press(user, /InstaPay/i);
    await press(user, /^Continue$/);

    expect(await screen.findByRole("alert")).toHaveTextContent(/caps a single transfer at ₱50,000/i);
    expect(screen.getByRole("button", { name: /Continue to confirm/i })).toBeDisabled();
  });

  it("blocks PESONet until the account is fully verified", async () => {
    const user = start({ kycTier: "verified" });
    await openBankDestination(user, "1000", "003812340001");
    expect(await screen.findByText(/Is that right\?/i)).toBeTruthy();
    await press(user, /PESONet/i);
    await press(user, /^Continue$/);

    expect(await screen.findByRole("alert")).toHaveTextContent(/fully verified/i);
  });

  it("tracks a PESONet transfer from pending to credited", async () => {
    const user = start({ kycTier: "full", settleAfterPolls: 1 });
    await openBankDestination(user, "1000", "003812340001");
    expect(await screen.findByText(/Is that right\?/i)).toBeTruthy();
    await press(user, /PESONet/i);
    await press(user, /^Continue$/);
    await press(user, /Continue to confirm/i);
    await user.type(screen.getByLabelText(/Transaction PIN/i), MOCK_TRANSACTION_PIN);
    await press(user, /Confirm payment/i);

    // A batch rail cannot promise the money arrived, only that it was accepted.
    expect(await screen.findByRole("heading", { name: /Transfer on its way/i })).toBeTruthy();

    await press(user, /Track this transfer/i);
    expect(await screen.findByText(/Waiting for the next batch/i)).toBeTruthy();

    await press(user, /Check for an update/i);
    expect(await screen.findByText(/Credited to the beneficiary/i)).toBeTruthy();
  });

  it("refuses to send more than the wallet holds", async () => {
    const user = start();
    // ₱30,000 from a wallet holding ₱24,680.50, to a saved FIN-A recipient.
    // The Amount step now catches this itself — Continue and review stays
    // disabled and the gateway is never even asked.
    await openTransfer(user, "30000");

    expect(await screen.findByRole("alert")).toHaveTextContent(/more than your available balance/i);
    expect(screen.getByRole("button", { name: /Continue and review/i })).toBeDisabled();
  });

  it("saves a verified bank account as a recipient", async () => {
    const user = start();
    await openBankDestination(user, "500", "003812340001");
    expect(await screen.findByText(/Is that right\?/i)).toBeTruthy();

    await user.click(screen.getByRole("switch", { name: /Save this recipient/i }));
    await press(user, /InstaPay/i);
    await press(user, /^Continue$/);
    await press(user, /Continue to confirm/i);
    await user.type(screen.getByLabelText(/Transaction PIN/i), MOCK_TRANSACTION_PIN);
    await press(user, /Confirm payment/i);
    expect(await screen.findByRole("heading", { name: /Transfer complete/i })).toBeTruthy();

    // Back through Send, the saved account is now in the recipients list.
    await press(user, /^Done$/);
    await press(user, /^Send$/);
    await press(user, /Add recipient/i);
    const list = screen.getByRole("region", { name: /Saved recipients/i });
    expect(within(list).getByText(/•••• 0001/)).toBeTruthy();
  });

  it("removes a saved recipient", async () => {
    const user = start();
    await openSendStep1(user);
    await press(user, /Add recipient/i);

    const list = screen.getByRole("region", { name: /Saved recipients/i });
    expect(within(list).getByText("Ate Rosa")).toBeTruthy();

    await press(user, /Remove Ate Rosa/i);
    expect(within(list).queryByText("Ate Rosa")).toBeNull();
  });
});
