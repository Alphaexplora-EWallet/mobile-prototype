export type Transaction = {
  id: string;
  /** Decorative glyph shown in the row. Not an IconName; these are emoji/symbols. */
  glyph: string;
  name: string;
  /** Display string today (e.g. "Today, 8:23 AM"). Deliberately not a Date — see README. */
  when: string;
  /** Pre-signed display string today (e.g. "−₱160.00"). Becomes signed Money later. */
  amount: string;
  /** True for money coming in. Derived from the amount once it is numeric. */
  positive: boolean;
};

export type ScheduledPayment = {
  id: string;
  glyph: string;
  name: string;
  when: string;
  amount: string;
};
