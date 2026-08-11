import type { IconName } from "./icons";
import type { BankCode } from "./rails";
import type { Money } from "../money/money";

export type DepositMethod = {
  id: string;
  icon: IconName;
  title: string;
  detail: string;
  /** What the partner charges. The screen used to claim "No fee" for all four. */
  fee: Money;
  arrivalLabel: string;
  /**
   * True when the money is *pushed to* the wallet rather than pulled by it. A
   * BaaS wallet cannot reach into another bank; it publishes a virtual account
   * and waits. Those methods open the funding screen instead of a payment.
   */
  inbound?: boolean;
};

export type Biller = {
  id: string;
  icon: IconName;
  name: string;
  detail: string;
  due: string;
};

export type Recipient = {
  /** Stable key. `initials` was used for this and is not unique. */
  id: string;
  initials: string;
  name: string;
  /**
   * Masked display string — "•••• 4471" for an account, "0917 ••• 2288" for a
   * mobile-keyed wallet. Stored rather than derived because the masking style
   * differs by destination type and this is the only thing the chips render.
   */
  handle: string;
  /** What the rail actually credits. Never rendered unmasked outside review. */
  accountNumber: string;
  bankCode: BankCode;
};

/** Last four of an account number, for building a `handle`. */
export const maskAccountNumber = (accountNumber: string): string => `•••• ${accountNumber.slice(-4)}`;

/**
 * An external bank account the user has linked for cash-out. Unlike `Recipient`
 * (which is often built ad hoc from a name inquiry), a saved account was
 * verified when it was linked, so the withdrawal flow skips the inquiry and
 * picks from this list instead. GAP-09 owns managing the list; this gap only
 * reads it.
 */
export type SavedBankAccount = {
  id: string;
  bankCode: BankCode;
  /** What the user calls it, e.g. "BPI Savings". */
  label: string;
  /** The account holder's name, confirmed when the account was linked. */
  accountName: string;
  accountNumber: string;
  /** Masked display string, e.g. "•••• 6612". */
  handle: string;
};

export type ScheduledPaymentStatus = "active" | "paused";

/**
 * Extends the fixture-only `ScheduledPayment` in `transaction.ts` with the
 * fields an autopay detail screen needs. Kept separate so the Home and Payments
 * rows keep rendering from the narrower shape.
 */
export type AutopayEnrollment = {
  id: string;
  billerId: string;
  glyph: string;
  name: string;
  /** Display string, e.g. "Autopay · Aug 18". Consistent with `Transaction.when`. */
  when: string;
  amount: Money;
  accountNumber: string;
  status: ScheduledPaymentStatus;
  sourceLabel: string;
};
