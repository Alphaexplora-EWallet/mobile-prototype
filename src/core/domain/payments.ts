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

/**
 * Catalog headings for the biller list. `BILLER_CATEGORY_ORDER` is the order
 * the Pay screen renders them in; the labels below are what it shows.
 */
export type BillerCategory = "electric" | "telecom" | "water" | "government" | "other";

export const BILLER_CATEGORY_ORDER: readonly BillerCategory[] = ["electric", "telecom", "water", "government", "other"];

export const BILLER_CATEGORY_LABELS: Readonly<Record<BillerCategory, string>> = {
  electric: "Electricity",
  telecom: "Telecom",
  water: "Water",
  government: "Government",
  other: "Other",
};

export type Biller = {
  id: string;
  icon: IconName;
  name: string;
  detail: string;
  due: string;
  category: BillerCategory;
};

/**
 * GAP-08: substring match on biller name, case-insensitive. A prefix is just a
 * substring that starts at the first character, so one rule covers both. The
 * empty query matches everything and surrounding whitespace is ignored.
 */
export function searchBillers(billers: readonly Biller[], query: string): readonly Biller[] {
  const term = query.trim().toLowerCase();
  if (!term) return billers;
  return billers.filter((biller) => biller.name.toLowerCase().includes(term));
}

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
