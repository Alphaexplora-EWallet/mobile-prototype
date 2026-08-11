import type { Money } from "../money/money";

export type Transaction = {
  id: string;
  /** Decorative glyph shown in the row. Not an IconName; these are emoji/symbols. */
  glyph: string;
  name: string;
  /** Display string. Deliberately not a Date: these are frozen fixtures, and a
   * real relative-time formatter needs timezone and locale requirements that
   * do not exist yet. */
  when: string;
  /** Calendar date, ISO `YYYY-MM-DD`. The machine-readable anchor `when`'s
   * display string renders from; derivations such as spending insights group
   * by the month of this field. Stored as a string because these are frozen
   * fixtures and the prototype has no timezone story. */
  date: string;
  /** Signed: negative is money leaving. Direction is derived, never stored. */
  amount: Money;
};

/** Replaces the hand-maintained `positive` flag that sat beside a signed string. */
export const isIncoming = (transaction: Transaction) => transaction.amount.amount > 0;

export type ScheduledPayment = {
  id: string;
  glyph: string;
  name: string;
  when: string;
  amount: Money;
};
