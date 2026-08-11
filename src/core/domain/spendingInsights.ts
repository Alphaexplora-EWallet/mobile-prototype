import type { BankingTransaction, TransactionKind } from "./banking";
import { addMoney, type Money, money, pesos } from "../money/money";

/**
 * Spending insights: a pure derivation of monthly spend over whatever
 * transactions it is given — the same activity feed the Activity screen
 * renders, no backend and no new fixture data.
 *
 * The only input it needs beyond what the activity feed already carried is a
 * calendar date per transaction (`Transaction.date`, ISO `YYYY-MM-DD`); the
 * `when` label stays a display string. Totals stay integer centavos until a
 * ViewModel formats them, and an empty period yields an empty derivation —
 * zero totals and no NaN — which the UI must show as an empty state, never as
 * "₱0.00" artifacts.
 */

/** The calendar month a transaction falls in: "2026-08-11" → "2026-08". */
export const monthIdOf = (date: string): string => date.slice(0, 7);

const MONTH_NAMES: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-08" → "August 2026". Hand-rolled like the money formatter: no Intl. */
export const monthLabel = (monthId: string): string => {
  const [year, month] = monthId.split("-");
  return `${MONTH_NAMES[Number(month) - 1] ?? month} ${year}`;
};

/** One grouped line of spend: a category or a merchant. */
export type SpendGroup = {
  /** Stable key — the category id, or the merchant's name. */
  key: string;
  label: string;
  /** Decorative glyph: the category's own, or the merchant's transaction glyph. */
  glyph: string;
  /** How many transactions landed in this group. */
  count: number;
  /** Absolute total in integer centavos. */
  total: Money;
};

/** The spend breakdown for one calendar month. */
export type MonthSpend = {
  monthId: string;
  monthLabel: string;
  /** All transactions dated in this month, incoming included — lets the UI
   * tell "no transactions" apart from "nothing went out". */
  transactionCount: number;
  /**
   * Outflows only, summed as absolute centavos. `pesos(0)` when nothing moved —
   * the ViewModel boundary decides whether that is ever rendered.
   */
  totalSpent: Money;
  categories: readonly SpendGroup[];
  merchants: readonly SpendGroup[];
};

export type SpendCategory = {
  id: TransactionKind;
  label: string;
  glyph: string;
};

/**
 * The category taxonomy. Categories are derived from the transaction `kind` —
 * the only stable spend vocabulary the fixtures carry — rather than inventing
 * a per-merchant classification that would need new fixture data. Incoming
 * kinds can never reach the derivation (outflows are filtered first), but the
 * map is total over `TransactionKind` so the derivation has no undefined
 * branch and a future inflow category renders sanely.
 */
export const SPEND_CATEGORIES: Readonly<Record<TransactionKind, SpendCategory>> = {
  "card-payment": { id: "card-payment", label: "Card purchases", glyph: "💳" },
  "bill-payment": { id: "bill-payment", label: "Bills & utilities", glyph: "⚡" },
  "transfer-out": { id: "transfer-out", label: "Transfers", glyph: "↗" },
  "qr-payment": { id: "qr-payment", label: "QR payments", glyph: "◫" },
  "cash-in": { id: "cash-in", label: "Cash in", glyph: "↙" },
  "transfer-in": { id: "transfer-in", label: "Money in", glyph: "↙" },
};

const absolute = (value: Money): Money => money(Math.abs(value.amount), value.currency);

const groupBy = (
  transactions: readonly BankingTransaction[],
  keyOf: (transaction: BankingTransaction) => string,
  labelOf: (transaction: BankingTransaction) => string,
  glyphOf: (transaction: BankingTransaction) => string,
): SpendGroup[] => {
  const byKey = new Map<string, SpendGroup>();
  for (const transaction of transactions) {
    const key = keyOf(transaction);
    const amount = absolute(transaction.amount);
    const existing = byKey.get(key);
    if (existing) {
      byKey.set(key, { ...existing, count: existing.count + 1, total: addMoney(existing.total, amount) });
    } else {
      byKey.set(key, { key, label: labelOf(transaction), glyph: glyphOf(transaction), count: 1, total: amount });
    }
  }
  // Biggest first; equal totals keep insertion order, so the order is stable.
  return [...byKey.values()].sort((a, b) => b.total.amount - a.total.amount);
};

/** The months present in the data, newest first. */
export const spendMonths = (transactions: readonly BankingTransaction[]): readonly string[] =>
  [...new Set(transactions.map((transaction) => monthIdOf(transaction.date)))].sort().reverse();

/**
 * The spend breakdown for one month. A month with no outflows yields empty
 * groups and a zero total — never NaN, because nothing here divides.
 *
 * Outflows count regardless of `status` except `returned`: a returned transfer
 * is not spend, the money came back, so it would inflate the month forever.
 * `pending` counts — the money is committed to leave.
 */
export function buildMonthSpend(transactions: readonly BankingTransaction[], monthId: string): MonthSpend {
  const inMonth = transactions.filter((transaction) => monthIdOf(transaction.date) === monthId);
  const outflows = inMonth.filter((transaction) => transaction.amount.amount < 0 && transaction.status !== "returned");
  const totalSpent = outflows.reduce((sum, transaction) => addMoney(sum, absolute(transaction.amount)), pesos(0));
  return {
    monthId,
    monthLabel: monthLabel(monthId),
    transactionCount: inMonth.length,
    totalSpent,
    categories: groupBy(
      outflows,
      (transaction) => transaction.kind,
      (transaction) => SPEND_CATEGORIES[transaction.kind].label,
      (transaction) => SPEND_CATEGORIES[transaction.kind].glyph,
    ),
    merchants: groupBy(
      outflows,
      (transaction) => transaction.name,
      (transaction) => transaction.name,
      (transaction) => transaction.glyph,
    ),
  };
}
