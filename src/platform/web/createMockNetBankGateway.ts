import type { BankAccount, InboundQrRequest, QrInstruction, QrPayload, VirtualAccount } from "@/core/domain/account";
import type {
  ActivityPage,
  ActivityQuery,
  BankingTransaction,
  PaymentQuote,
  PaymentReceipt,
} from "@/core/domain/banking";
import { railName } from "@/core/domain/banking";
import type { CardId } from "@/core/domain/card";
import type { KycStatus, KycTier, TierLimits } from "@/core/domain/compliance";
import type { Statement } from "@/core/domain/statement";
import { nextKycTier } from "@/core/domain/compliance";
import { failed, type GatewayErrorCode, type GatewayResult, ok } from "@/core/domain/gatewayResult";
import {
  intentCardId,
  intentCardLabel,
  intentRail,
  intentTransactionKind,
  isIncomingIntent,
  JAR_LABEL,
  type PaymentIntent,
  requiresStepUp,
} from "@/core/domain/paymentIntent";
import type { Biller } from "@/core/domain/payments";
import type { Bank } from "@/core/domain/rails";
import type { ConfirmationToken, DeviceSession, OtpChallenge, OtpPurpose } from "@/core/domain/security";
import { NO_CONFIRMATION_REQUIRED } from "@/core/domain/security";
import { MOCK_ACCOUNTS, MOCK_QR_INSTRUCTIONS, MOCK_VIRTUAL_ACCOUNT } from "@/core/data/mock/accounts.mock";
import { MOCK_BANKS, RAIL_PRICING } from "@/core/data/mock/banks.mock";
import { MOCK_CARDS } from "@/core/data/mock/cards.mock";
import { INITIAL_KYC_STATUS, limitsForTier, MOCK_STATEMENTS } from "@/core/data/mock/compliance.mock";
import { MOCK_BILLERS, MOCK_RECIPIENTS, MOCK_TRANSACTIONS } from "@/core/data/mock/payments.mock";
import {
  MOCK_OTP_CODE,
  MOCK_OTP_DESTINATION,
  MOCK_SESSIONS,
  MOCK_TRANSACTION_PIN,
} from "@/core/data/mock/security.mock";
import { formatMoney } from "@/core/money/format";
import { isValidMobileNumber, maskMobileNumber as maskMobileDigits } from "@/core/domain/mobile";
import { addMoney, compareMoney, type Money, money, pesos, subtractMoney } from "@/core/money/money";
import { maskMobileNumber } from "@/core/domain/load";
import type {
  AccountNameResult,
  AccountsPort,
  ActivityPort,
  BankingGateway,
  BillAccountResult,
  CompliancePort,
  DirectoryPort,
  MobileNameResult,
  JarState,
  PaymentsPort,
  SecurityPort,
} from "@/core/platform/bankingGateway";

/** Every gateway call, so a test can fail exactly one of them. */
export type MockGatewayCall =
  | "accounts.list"
  | "accounts.virtualAccount"
  | "accounts.statements"
  | "activity.list"
  | "activity.get"
  | "activity.dispute"
  | "directory.banks"
  | "directory.verifyAccountName"
  | "directory.lookupMobileName"
  | "directory.billers"
  | "directory.validateBillAccount"
  | "payments.quote"
  | "payments.submit"
  | "payments.status"
  | "payments.openJar"
  | "payments.jarState"
  | "payments.createInboundQr"
  | "payments.decodeQr"
  | "compliance.kycStatus"
  | "compliance.submitKyc"
  | "compliance.limits"
  | "security.requestOtp"
  | "security.verifyOtp"
  | "security.verifyPin"
  | "security.setPin"
  | "security.sessions"
  | "security.revokeSession";

export type MockGatewayOptions = {
  /**
   * Defaults to 0. Tests depend on that: a real delay would make every
   * assertion a race. `main.tsx` passes a realistic value so the dev server
   * actually shows the loading and error states the screens already render.
   */
  latencyMs?: number;
  /** Force one call to fail with a given code, for the unhappy-path tests. */
  failures?: Readonly<Partial<Record<MockGatewayCall, GatewayErrorCode>>>;
  /** PESONet is gated behind the `full` tier, so this decides what works. */
  kycTier?: KycTier;
  /**
   * Seed the KYC submission as rejected, so the resubmission path is reachable
   * instead of dead code. `reason` is what the status screen shows; `stepIndex`
   * is the capture step that failed review, where a resubmit restarts.
   */
  kycRejection?: { reason: string; stepIndex: number } | null;
  /** How many `payments.status` polls a pending transfer needs to clear. */
  settleAfterPolls?: number;
  /**
   * Replaces the seeded activity feed. Defaults to `MOCK_TRANSACTIONS` with
   * kinds/status/references attached. Tests use this to reach states the
   * default fixtures do not show — e.g. a month with no transactions.
   */
  seedActivity?: readonly BankingTransaction[];
  /**
   * The simulated "today" that session receipts are dated against. Fixed by
   * default so the mock stays deterministic; `MOCK_TRANSACTIONS` dates follow
   * the same timeline ("Today, 8:23 AM" → 2026-08-11).
   */
  todayIso?: string;
};

/**
 * A transfer to an account number ending in these digits is accepted by the rail
 * and then rejected by the beneficiary bank — the PESONet return path. That is a
 * distinct outcome from a failure, and the reason `TransactionStatus` has a
 * `returned` member.
 */
export const MOCK_RETURNING_SUFFIX = "9999";

/** Deterministic stand-in for an account name inquiry on an unknown number. */
const INQUIRY_NAMES: readonly string[] = [
  "MARIA CLARA S. DELA CRUZ",
  "JUAN P. LUNA",
  "ANDRES B. BONIFACIO",
  "GABRIELA C. SILANG",
  "APOLINARIO M. MABINI",
];

/**
 * Stands in for randomness. `Math.random()` would make the mock non-reproducible
 * and `Date.now()` is unavailable to workflow-style determinism, so anything that
 * needs to look arbitrary is derived from the input instead.
 */
const digitSum = (value: string): number =>
  [...value].reduce((total, character) => total + (Number.isNaN(Number(character)) ? 0 : Number(character)), 0);

const MESSAGES: Readonly<Record<GatewayErrorCode, string>> = {
  "insufficient-funds": "This wallet does not hold enough to cover that.",
  "limit-exceeded": "That is over the limit for this rail.",
  "invalid-account": "Those details did not check out.",
  "rail-unavailable": "That rail is not answering right now. Try again shortly.",
  "rail-cutoff-passed": "Today's cut-off has passed, so this credits the next banking day.",
  "kyc-required": "Finish verifying your account to use this.",
  "confirmation-required": "Confirm this payment to send it.",
  "duplicate-request": "We already have this request.",
  "not-found": "We could not find that.",
  network: "We could not reach NetBank. Check your connection and try again.",
};

const REFERENCE_PREFIX: Readonly<Record<PaymentIntent["kind"], string>> = {
  transfer: "NBK-TRF",
  "cash-in": "NBK-CSH",
  "cash-out": "NBK-WDR",
  bill: "NBK-BIL",
  qr: "NBK-QRP",
  buyload: "NBK-LOD",
  request: "NBK-RQS",
  "jar-in": "NBK-JIN",
  "jar-out": "NBK-JOT",
};

const RECEIPT_GLYPH: Readonly<Record<PaymentIntent["kind"], string>> = {
  transfer: "↗",
  "cash-in": "↙",
  "cash-out": "↗",
  bill: "⚡",
  qr: "◫",
  buyload: "☎",
  request: "↙",
  "jar-in": "↓",
  "jar-out": "↑",
};

const seedActivity = (): BankingTransaction[] =>
  MOCK_TRANSACTIONS.map((transaction, index) => ({
    ...transaction,
    kind: transaction.amount.amount < 0 ? "card-payment" : "transfer-in",
    status: "completed",
    reference: `NBK-2026-000${index + 1}`,
    description:
      transaction.amount.amount < 0
        ? `Card payment to ${transaction.name}.`
        : `Funds received through the NetBank sandbox rail.`,
    sourceLabel: transaction.amount.amount < 0 ? "Main wallet •••• 4821" : undefined,
  }));

const seedBalances = (): Record<CardId, Money> =>
  MOCK_CARDS.reduce((balances, card) => ({ ...balances, [card.id]: card.balance }), {} as Record<CardId, Money>);

/** Matched on the last four, because a card's display label changes with the quest reward. */
const cardIdForLabel = (sourceLabel: string | undefined): CardId | null =>
  MOCK_CARDS.find((card) => sourceLabel?.endsWith(card.last4))?.id ?? null;

/** Cash-in pricing belongs to the partner, so it travels on the method itself. */
const nonRailFee = (intent: PaymentIntent): Money => (intent.kind === "cash-in" ? intent.method.fee : pesos(0));

const nonRailArrivalLabel = (intent: PaymentIntent): string => {
  if (intent.kind === "cash-in") return intent.method.arrivalLabel;
  if (intent.kind === "bill") return "Posted to the biller within one banking day";
  if (intent.kind === "buyload") return "Credited to the number instantly";
  if (intent.kind === "request") return "Credited to your wallet instantly";
  if (intent.kind === "jar-in" || intent.kind === "jar-out") return "Moved instantly";
  return "Paid instantly";
};

const receiptName = (intent: PaymentIntent): string => {
  switch (intent.kind) {
    case "transfer":
      return `Sent to ${intent.recipient.name}`;
    case "cash-in":
      return `Added via ${intent.method.title}`;
    case "bill":
      return `Paid ${intent.biller.name}`;
    case "qr":
      return `Paid ${intent.instruction.merchantName}`;
    case "cash-out":
      return `Withdrawn to ${intent.account.name}`;
    case "buyload":
      return `Bought ${intent.operator.name} load`;
    case "request":
      return `Received from ${intent.payer.name}`;
    case "jar-in":
    case "jar-out":
      return JAR_LABEL;
  }
};

const receiptDescription = (intent: PaymentIntent): string => {
  switch (intent.kind) {
    case "transfer":
      return intent.note.trim() || `Money sent to ${intent.recipient.name}.`;
    case "qr":
      return intent.note.trim() || `QR PH payment to ${intent.instruction.merchantName}.`;
    case "bill":
      return `${intent.biller.name} account ${intent.accountNumber}.`;
    case "cash-in":
      return `Cash in through ${intent.method.title}.`;
    case "cash-out":
      return `Cash-out of ${formatMoney(intent.amount)} to ${intent.account.name} (${intent.account.handle}).`;
    case "buyload":
      // The number is masked even inside the receipt copy; it never renders raw.
      return `${intent.operator.name} load for ${maskMobileNumber(intent.phoneNumber)}.`;
    case "request":
      return intent.note.trim() || `Payment for your money request from ${intent.payer.name}.`;
    case "jar-in":
      return `Moved into the ${JAR_LABEL}.`;
    case "jar-out":
      return `Moved out of the ${JAR_LABEL}.`;
  }
};

/**
 * In-memory NetBank-shaped adapter for the prototype. Replace this only in a
 * server-side composition root when authenticated API access is available.
 *
 * It holds the balances rather than reading them from the wallet store, because
 * the bank is what actually knows them — which is why `insufficient-funds` can
 * be a real answer here and could not be before.
 */
/** The simulated "now" the seed fixtures' "Today"/"Yesterday" labels point at. */
const DEFAULT_TODAY_ISO = "2026-08-11";

/**
 * What `createMockNetBankGateway` actually returns: the full contract plus the
 * simulation-only `reset`. The interface keeps `reset` optional so the offline
 * gateway and a future server adapter can omit it; the mock always provides it.
 */
export type MockNetBankGateway = BankingGateway & {
  reset(): void;
};

export function createMockNetBankGateway(options: MockGatewayOptions = {}): MockNetBankGateway {
  const {
    latencyMs = 0,
    failures = {},
    kycTier = INITIAL_KYC_STATUS.tier,
    kycRejection = null,
    settleAfterPolls = 2,
    seedActivity: seed = undefined,
    todayIso = DEFAULT_TODAY_ISO,
  } = options;

  let activityLog: BankingTransaction[] = seed ? [...seed] : seedActivity();
  let balances = seedBalances();
  let jarState: JarState = { opened: false, balance: pesos(0) };
  /** The seeded KYC posture, recomputed on `reset` so a rejection survives rewind. */
  const initialKyc = (): KycStatus =>
    kycRejection
      ? {
          ...INITIAL_KYC_STATUS,
          tier: kycTier,
          state: "rejected",
          submittedLabel: "Rejected Jul 2, 2026",
          reviewNote: kycRejection.reason,
          rejectedStepIndex: kycRejection.stepIndex,
        }
      : { ...INITIAL_KYC_STATUS, tier: kycTier };
  let kyc: KycStatus = initialKyc();
  let sessionList: readonly DeviceSession[] = MOCK_SESSIONS;
  /**
   * The demo account ships with `MOCK_TRANSACTION_PIN`; a sign-up replaces it
   * with the PIN the new user chose. This mirrors `identity.users.pin_hash` —
   * the gateway owns the credential, the ViewModel never sees it.
   */
  let transactionPin = MOCK_TRANSACTION_PIN;
  let idempotencyCounter = 0;
  let referenceCounters: Record<string, number> = {};
  /** Replaying a key returns the original receipt instead of paying twice. */
  const submitted = new Map<string, PaymentReceipt>();
  const issuedTokens = new Set<ConfirmationToken>();
  const pollCounts = new Map<string, number>();

  /**
   * Rewinds every mutable fixture to its seeded state. The gateway outlives the
   * navigation stack (it is a module singleton from `main.tsx`), so signing out
   * must rewind it here or the previous session's PIN, balances and KYC tier
   * leak into the next sign-in. A server adapter would have no such method.
   */
  const reset = (): void => {
    activityLog = seed ? [...seed] : seedActivity();
    balances = seedBalances();
    jarState = { opened: false, balance: pesos(0) };
    kyc = initialKyc();
    sessionList = MOCK_SESSIONS;
    transactionPin = MOCK_TRANSACTION_PIN;
    idempotencyCounter = 0;
    referenceCounters = {};
    submitted.clear();
    issuedTokens.clear();
    pollCounts.clear();
  };

  const settle = <T>(call: MockGatewayCall, produce: () => GatewayResult<T>): Promise<GatewayResult<T>> => {
    const forced = failures[call];
    const run = (): GatewayResult<T> => (forced ? failed(forced, MESSAGES[forced]) : produce());
    return latencyMs > 0
      ? new Promise((resolve) => setTimeout(() => resolve(run()), latencyMs))
      : Promise.resolve(run());
  };

  const nextReference = (kind: PaymentIntent["kind"]): string => {
    const prefix = REFERENCE_PREFIX[kind];
    referenceCounters[prefix] = (referenceCounters[prefix] ?? 0) + 1;
    return `${prefix}-${String(referenceCounters[prefix]).padStart(6, "0")}`;
  };

  const quoteFor = (intent: PaymentIntent): PaymentQuote => {
    const rail = intentRail(intent);
    const pricing = rail ? RAIL_PRICING[rail] : null;
    const fee = pricing ? pricing.fee : nonRailFee(intent);
    return {
      rail,
      amount: intent.amount,
      fee,
      total: addMoney(intent.amount, fee),
      arrivalLabel: pricing ? pricing.arrivalLabel : nonRailArrivalLabel(intent),
      cutoffLabel: pricing?.cutoffLabel,
      limitLabel:
        pricing?.perTransaction && rail
          ? `${formatMoney(pricing.perTransaction)} per ${railName(rail)} transfer`
          : undefined,
      settlesLater: pricing?.cutoffLabel !== undefined,
    };
  };

  /** Reasons an intent cannot proceed, checked before anything changes. */
  const rejectIntent = (intent: PaymentIntent, quote: PaymentQuote): GatewayResult<never> | null => {
    if (intent.amount.amount <= 0) return failed("invalid-account", "Enter an amount greater than zero.");

    if (intent.kind === "jar-in" || intent.kind === "jar-out") {
      if (!jarState.opened) {
        return failed("not-found", `Open a ${JAR_LABEL} before moving money into it.`);
      }
      if (intent.kind === "jar-out" && compareMoney(intent.amount, jarState.balance) > 0) {
        return failed(
          "insufficient-funds",
          `That is ${formatMoney(subtractMoney(intent.amount, jarState.balance))} more than your jar holds.`,
        );
      }
    }

    const rail = intentRail(intent);
    if (rail && rail !== "internal") {
      const limit = limitsForTier(kyc.tier).rails.find((entry) => entry.rail === rail);
      if (!limit?.available) {
        return failed(
          "kyc-required",
          `${railName(rail)} transfers need a fully verified account. Finish verification to unlock them.`,
        );
      }
      if (limit.perTransaction && compareMoney(intent.amount, limit.perTransaction) > 0) {
        return failed(
          "limit-exceeded",
          `${railName(rail)} caps a single transfer at ${formatMoney(limit.perTransaction)}.`,
        );
      }
      if (compareMoney(addMoney(limit.usedToday, intent.amount), limit.daily) > 0) {
        return failed(
          "limit-exceeded",
          `That would pass your ${formatMoney(limit.daily)} daily ${railName(rail)} limit.`,
        );
      }
    }

    if (intent.kind !== "cash-in" && intent.kind !== "request" && intent.kind !== "jar-out") {
      const available = balances[intent.sourceCardId];
      if (available && compareMoney(quote.total, available) > 0) {
        return failed(
          "insufficient-funds",
          `That is ${formatMoney(subtractMoney(quote.total, available))} more than this wallet holds.`,
        );
      }
    }

    return null;
  };

  const applyToBalance = (intent: PaymentIntent, quote: PaymentQuote) => {
    if (intent.kind === "jar-in" || intent.kind === "jar-out") {
      // A jar move touches two balances: the wallet card and the jar itself.
      const cardId = intentCardId(intent);
      const current = balances[cardId];
      if (!current) return;
      if (intent.kind === "jar-in") {
        // The card pays quote.total while the jar receives intent.amount. Those
        // only match because jar moves are free by design (nonRailFee → pesos(0),
        // no rail). If a jar fee is ever introduced, this branch would destroy
        // centavos — keep jar fees at zero.
        balances = { ...balances, [cardId]: subtractMoney(current, quote.total) };
        jarState = { ...jarState, balance: addMoney(jarState.balance, intent.amount) };
      } else {
        balances = { ...balances, [cardId]: addMoney(current, intent.amount) };
        jarState = { ...jarState, balance: subtractMoney(jarState.balance, intent.amount) };
      }
      return;
    }
    const cardId = intentCardId(intent);
    const current = balances[cardId];
    if (!current) return;
    balances = {
      ...balances,
      [cardId]: isIncomingIntent(intent) ? addMoney(current, intent.amount) : subtractMoney(current, quote.total),
    };
  };

  const accounts: AccountsPort = {
    async list() {
      return settle<readonly BankAccount[]>("accounts.list", () =>
        ok(MOCK_ACCOUNTS.map((account) => ({ ...account, balance: balances[account.cardId] ?? account.balance }))),
      );
    },
    async virtualAccount(accountId) {
      return settle<VirtualAccount>("accounts.virtualAccount", () =>
        MOCK_ACCOUNTS.some((account) => account.id === accountId)
          ? ok(MOCK_VIRTUAL_ACCOUNT)
          : failed("not-found", "That account does not exist."),
      );
    },
    async statements() {
      return settle<readonly Statement[]>("accounts.statements", () =>
        kyc.tier === "full"
          ? ok(MOCK_STATEMENTS)
          : failed("kyc-required", "Statements unlock once you are fully verified."),
      );
    },
  };

  const activity: ActivityPort = {
    async list(query: ActivityQuery = {}) {
      return settle<ActivityPage>("activity.list", () => {
        const { cursor, limit = 20, kinds, statuses, search } = query;
        const term = search?.trim().toLowerCase();
        const matched = activityLog.filter((transaction) => {
          if (kinds && !kinds.includes(transaction.kind)) return false;
          if (statuses && !statuses.includes(transaction.status)) return false;
          if (!term) return true;
          return transaction.name.toLowerCase().includes(term) || transaction.reference.toLowerCase().includes(term);
        });
        const start = cursor ? Number(cursor) : 0;
        const page = matched.slice(start, start + limit);
        const end = start + page.length;
        return ok({ items: page, nextCursor: end < matched.length ? String(end) : undefined });
      });
    },
    async get(id) {
      return settle<BankingTransaction | null>("activity.get", () =>
        ok(activityLog.find((transaction) => transaction.id === id) ?? null),
      );
    },
    async dispute(id, reason) {
      return settle<BankingTransaction>("activity.dispute", () => {
        const existing = activityLog.find((transaction) => transaction.id === id);
        if (!existing) return failed("not-found", "That transaction no longer exists.");
        const disputed: BankingTransaction = {
          ...existing,
          description: `${existing.description} Dispute filed: ${reason}`,
        };
        activityLog = activityLog.map((transaction) => (transaction.id === id ? disputed : transaction));
        return ok(disputed);
      });
    },
  };

  const directory: DirectoryPort = {
    async banks() {
      return settle<readonly Bank[]>("directory.banks", () => ok(MOCK_BANKS));
    },
    async verifyAccountName(bankCode, accountNumber) {
      return settle<AccountNameResult>("directory.verifyAccountName", () => {
        const digits = accountNumber.replace(/\s/g, "");
        if (!/^\d{10,16}$/.test(digits)) {
          return failed("invalid-account", "That account number does not look right. Check the digits and try again.");
        }
        if (!MOCK_BANKS.some((bank) => bank.code === bankCode)) {
          return failed("invalid-account", "Choose a bank before we can check the name.");
        }
        const known = MOCK_RECIPIENTS.find((recipient) => recipient.accountNumber === digits);
        const accountName = known ? known.name.toUpperCase() : INQUIRY_NAMES[digitSum(digits) % INQUIRY_NAMES.length];
        return ok({ accountName, bankCode, accountNumber: digits });
      });
    },
    async lookupMobileName(phoneNumber) {
      return settle<MobileNameResult>("directory.lookupMobileName", () => {
        const digits = phoneNumber.replace(/[\s-]/g, "");
        if (!isValidMobileNumber(digits)) {
          return failed("invalid-account", "Enter an 11-digit Philippine mobile number starting with 09.");
        }
        const known = MOCK_RECIPIENTS.find((recipient) => recipient.accountNumber === digits);
        if (!known) {
          return failed("not-found", "No FIN-A wallet is registered to that number yet.");
        }
        return ok({ accountName: known.name.toUpperCase(), phoneNumber: digits });
      });
    },
    async billers() {
      return settle<readonly Biller[]>("directory.billers", () => ok(MOCK_BILLERS));
    },
    async validateBillAccount(billerId, accountNumber) {
      return settle<BillAccountResult>("directory.validateBillAccount", () => {
        const biller = MOCK_BILLERS.find((candidate) => candidate.id === billerId);
        if (!biller) return failed("not-found", "That biller is no longer available.");
        const digits = accountNumber.replace(/\s/g, "");
        if (digits.length < 6) {
          return failed("invalid-account", `${biller.name} account numbers are at least 6 digits.`);
        }
        return ok({
          accountName: INQUIRY_NAMES[digitSum(digits) % INQUIRY_NAMES.length],
          amountDue: pesos(1_000 + (digitSum(digits) % 20) * 100),
        });
      });
    },
  };

  const payments: PaymentsPort = {
    async quote(intent) {
      return settle<PaymentQuote>("payments.quote", () => {
        const quote = quoteFor(intent);
        return rejectIntent(intent, quote) ?? ok(quote);
      });
    },
    async submit(intent, idempotencyKey, confirmation) {
      return settle<PaymentReceipt>("payments.submit", () => {
        const replay = submitted.get(idempotencyKey);
        if (replay) return ok(replay);

        const confirmed = requiresStepUp(intent)
          ? issuedTokens.has(confirmation)
          : confirmation === NO_CONFIRMATION_REQUIRED || issuedTokens.has(confirmation);
        if (!confirmed) return failed("confirmation-required", MESSAGES["confirmation-required"]);

        const quote = quoteFor(intent);
        const rejection = rejectIntent(intent, quote);
        if (rejection) return rejection;

        const reference = nextReference(intent.kind);
        const signed =
          isIncomingIntent(intent) || intent.kind === "jar-out" ? intent.amount.amount : -intent.amount.amount;
        // For jar-out the money leaves the jar, so the "From" label is the jar,
        // not the card it lands on (intentCardLabel would name the destination).
        const sourceLabel = intent.kind === "jar-out" ? JAR_LABEL : intentCardLabel(intent);
        const receipt: PaymentReceipt = {
          id: `netbank-${reference.toLowerCase()}`,
          glyph: RECEIPT_GLYPH[intent.kind],
          name: receiptName(intent),
          when: "Just now",
          date: todayIso,
          amount: money(signed, intent.amount.currency),
          kind: intentTransactionKind(intent),
          status: quote.settlesLater ? "pending" : "completed",
          reference,
          description: receiptDescription(intent),
          sourceLabel,
          recipient:
            intent.kind === "transfer"
              ? intent.recipient
              : intent.kind === "cash-out"
                ? intent.account
                : intent.kind === "request"
                  ? intent.payer
                  : undefined,
          fee: quote.fee,
          rail: quote.rail ?? undefined,
          arrivalLabel: quote.arrivalLabel,
        };

        applyToBalance(intent, quote);
        activityLog = [receipt, ...activityLog];
        submitted.set(idempotencyKey, receipt);
        issuedTokens.delete(confirmation);
        return ok(receipt);
      });
    },
    async status(id) {
      return settle<BankingTransaction>("payments.status", () => {
        const existing = activityLog.find((transaction) => transaction.id === id);
        if (!existing) return failed("not-found", "That transaction no longer exists.");
        if (existing.status !== "pending") return ok(existing);

        const polls = (pollCounts.get(id) ?? 0) + 1;
        pollCounts.set(id, polls);
        if (polls < settleAfterPolls) return ok(existing);

        const returned = existing.recipient?.accountNumber.endsWith(MOCK_RETURNING_SUFFIX) ?? false;
        const cleared: BankingTransaction = returned
          ? {
              ...existing,
              status: "returned",
              description: `${existing.description} The beneficiary bank returned this transfer, so the amount is back in your wallet.`,
            }
          : { ...existing, status: "completed" };

        if (returned) {
          const cardId = cardIdForLabel(existing.sourceLabel);
          const current = cardId ? balances[cardId] : null;
          if (cardId && current) {
            const refund = money(Math.abs(existing.amount.amount), existing.amount.currency);
            balances = { ...balances, [cardId]: addMoney(addMoney(current, refund), existing.fee ?? pesos(0)) };
          }
        }

        activityLog = activityLog.map((transaction) => (transaction.id === id ? cleared : transaction));
        return ok(cleared);
      });
    },
    async openJar() {
      return settle<JarState>("payments.openJar", () => {
        if (!jarState.opened) jarState = { opened: true, balance: pesos(0) };
        return ok(jarState);
      });
    },
    async jarState() {
      return settle<JarState>("payments.jarState", () => ok(jarState));
    },
    async createInboundQr(request: InboundQrRequest) {
      return settle<QrPayload>("payments.createInboundQr", () => {
        const account = MOCK_ACCOUNTS.find((candidate) => candidate.cardId === request.cardId);
        if (!account) return failed("not-found", "That wallet cannot receive a QR payment.");
        const amountField = request.amount ? `54${String(request.amount.amount / 100)}` : "";
        return ok({
          payload: `00020101021128620011ph.ppmi.qrph0111${account.accountNumber}5204581253036085802PH${amountField}5913${account.accountName}6011Quezon City`,
          merchantName: account.accountName,
          amount: request.amount,
          note: request.note,
          expiresLabel: request.amount ? "Single use · expires in 15 minutes" : "Reusable · no expiry",
        });
      });
    },
    async decodeQr(payload) {
      return settle<QrInstruction>("payments.decodeQr", () => {
        const trimmed = payload.trim();
        const match = MOCK_QR_INSTRUCTIONS.find(
          (instruction) =>
            instruction.payload === trimmed || instruction.reference.toLowerCase() === trimmed.toLowerCase(),
        );
        return match ? ok(match) : failed("invalid-account", "That is not a QR PH code this wallet can read.");
      });
    },
  };

  const compliance: CompliancePort = {
    async kycStatus() {
      return settle<KycStatus>("compliance.kycStatus", () => ok(kyc));
    },
    async submitKyc(submission) {
      return settle<KycStatus>("compliance.submitKyc", () => {
        if (!submission.frontCaptured || !submission.selfieCaptured) {
          return failed("invalid-account", "We still need your ID and a selfie before we can review this.");
        }
        if (!submission.addressLine.trim() || !submission.city.trim()) {
          return failed("invalid-account", "Add your home address so we can finish verification.");
        }
        // A resubmission clears the rejection and promotes — the mock simulates
        // that the corrected capture passed review.
        const promoted = nextKycTier(kyc.tier);
        kyc = { tier: promoted ?? kyc.tier, state: "approved", submittedLabel: "Approved just now" };
        return ok(kyc);
      });
    },
    async limits() {
      return settle<TierLimits>("compliance.limits", () => ok(limitsForTier(kyc.tier)));
    },
  };

  const security: SecurityPort = {
    async requestOtp(_purpose: OtpPurpose, destination?: string) {
      return settle<OtpChallenge>("security.requestOtp", () =>
        ok({
          // A sign-up hands the number over for the first time, so the
          // challenge masks the number it was just sent to; every other purpose
          // is answered from the account the gateway already knows.
          maskedDestination: destination ? maskMobileDigits(destination) : MOCK_OTP_DESTINATION,
          expiresInLabel: "Expires in 5 minutes",
          digits: 6,
        }),
      );
    },
    async verifyOtp(purpose, code) {
      return settle<ConfirmationToken>("security.verifyOtp", () => {
        if (code.trim() !== MOCK_OTP_CODE) return failed("invalid-account", "That code is not right. Try again.");
        const token = `otp-${purpose}-${issuedTokens.size + 1}`;
        issuedTokens.add(token);
        return ok(token);
      });
    },
    async verifyPin(pin) {
      return settle<ConfirmationToken>("security.verifyPin", () => {
        if (pin.trim() !== transactionPin) {
          return failed("invalid-account", "That PIN is not right. Try again.");
        }
        const token = `pin-${issuedTokens.size + 1}`;
        issuedTokens.add(token);
        return ok(token);
      });
    },
    async setPin(pin) {
      return settle<null>("security.setPin", () => {
        if (!/^\d{6}$/.test(pin)) {
          return failed("invalid-account", "Your transaction PIN is exactly 6 digits.");
        }
        transactionPin = pin;
        return ok(null);
      });
    },
    async sessions() {
      return settle<readonly DeviceSession[]>("security.sessions", () => ok(sessionList));
    },
    async revokeSession(id) {
      return settle<readonly DeviceSession[]>("security.revokeSession", () => {
        const target = sessionList.find((session) => session.id === id);
        if (!target) return failed("not-found", "That session has already ended.");
        if (target.current) return failed("invalid-account", "You cannot sign out the device you are using.");
        sessionList = sessionList.filter((session) => session.id !== id);
        return ok(sessionList);
      });
    },
  };

  return {
    accounts,
    activity,
    directory,
    payments,
    compliance,
    security,
    nextIdempotencyKey: () => {
      idempotencyCounter += 1;
      return `IDMP-${String(idempotencyCounter).padStart(6, "0")}`;
    },
    reset,
  };
}
