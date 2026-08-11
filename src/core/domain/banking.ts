import type { Recipient } from "./payments";
import type { TransferRail } from "./rails";
import type { Transaction } from "./transaction";
import type { Money } from "../money/money";

/**
 * The app's bank-facing vocabulary. It intentionally avoids NetBank request
 * shapes: a server-side adapter can translate this stable contract to the
 * provider API without exposing credentials or provider-specific fields to
 * the client.
 */
export type TransactionKind =
  "card-payment" | "cash-in" | "transfer-in" | "transfer-out" | "bill-payment" | "qr-payment";

/**
 * `returned` is a real PESONet outcome and distinct from `failed`: the money
 * left, the beneficiary bank rejected it, and it comes back. The status screen
 * needs to say that rather than "failed".
 */
export type TransactionStatus = "completed" | "pending" | "failed" | "returned";

/** Rails and the bank directory live in `rails.ts`; re-exported for convenience. */
export type { Bank, BankCode, RailInfo, TransferRail } from "./rails";
export { defaultRailFor, FINA_BANK_CODE, RAIL_INFO, railName } from "./rails";

export type BankingTransaction = Transaction & {
  kind: TransactionKind;
  status: TransactionStatus;
  reference: string;
  description: string;
  sourceLabel?: string;
  recipient?: Recipient;
  fee?: Money;
  /** Absent on card payments, which never travelled a rail. */
  rail?: TransferRail;
};

/** What a rail will charge and promise for one specific intent. */
export type PaymentQuote = {
  /** Null for cash-in and bills, where the rail is the provider's business. */
  rail: TransferRail | null;
  amount: Money;
  fee: Money;
  /** amount + fee. Precomputed so no view has to do arithmetic. */
  total: Money;
  arrivalLabel: string;
  /** Present when the rail has a daily cut-off the user should know about. */
  cutoffLabel?: string;
  /** Present when a cap applies, e.g. "₱50,000 per InstaPay transfer". */
  limitLabel?: string;
  settlesLater: boolean;
};

/**
 * A completed (or accepted-and-pending) money movement. Generalises the old
 * `TransferReceipt`: cash-in, bills and QR payments all produce one, and the
 * screen picks its copy from `kind`.
 */
export type PaymentReceipt = BankingTransaction & {
  sourceLabel: string;
  fee: Money;
  arrivalLabel: string;
};

export type ActivityQuery = {
  /** Opaque cursor from the previous page. Absent means "from the start". */
  cursor?: string;
  limit?: number;
  kinds?: readonly TransactionKind[];
  statuses?: readonly TransactionStatus[];
  /** Matched against the counterparty name and the reference. */
  search?: string;
};

export type ActivityPage = {
  items: readonly BankingTransaction[];
  /** Absent when this is the last page. */
  nextCursor?: string;
};

/** Whether a status is still in flight and worth polling `payments.status` for. */
export const isSettling = (status: TransactionStatus): boolean => status === "pending";
