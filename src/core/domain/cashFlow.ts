import type { Statement } from "./statement";
import { addMoney, type Money, money, pesos, ratio, subtractMoney } from "../money/money";

/**
 * Cash flow: income vs. expenses for a statement period, and how each figure
 * moved against the period before it. Built on the same `Statement` rows the
 * export flow already reconciles (opening + rows = closing), so there is no
 * second data source to drift from the account's real statements.
 */

export type PercentChange = {
  /** Signed whole percent; negative is a decrease. */
  percent: number;
  direction: "up" | "down" | "flat";
};

export type CashFlowPeriod = {
  periodLabel: string;
  /** Both non-negative — direction lives in which bucket a row landed in. */
  income: Money;
  expenses: Money;
};

export type CashFlowSummary = {
  current: CashFlowPeriod;
  incomeChange: PercentChange | null;
  expensesChange: PercentChange | null;
};

const absolute = (value: Money): Money => money(Math.abs(value.amount), value.currency);

const sumPeriod = (statement: Statement): CashFlowPeriod => {
  let income = pesos(0);
  let expenses = pesos(0);
  for (const entry of statement.entries) {
    if (entry.amount.amount > 0) income = addMoney(income, entry.amount);
    else if (entry.amount.amount < 0) expenses = addMoney(expenses, absolute(entry.amount));
  }
  return { periodLabel: statement.periodLabel, income, expenses };
};

/** Whole-percent change of `current` over `previous`. Null off a zero base — nothing to compare against, not 0%. */
export const percentChange = (current: Money, previous: Money): PercentChange | null => {
  if (previous.amount === 0) return null;
  const percent = Math.round(ratio(subtractMoney(current, previous), previous) * 100);
  return { percent, direction: percent > 0 ? "up" : percent < 0 ? "down" : "flat" };
};

/**
 * `statements` must be newest-first, exactly what `MOCK_STATEMENTS` and the
 * gateway's `accounts.statements()` already return. The current period is the
 * newest statement; the comparison is against the one immediately before it.
 * No statements yields no summary — an empty derivation, same discipline as
 * `buildMonthSpend`: the ViewModel decides how an absent summary renders,
 * never a zero/NaN stand-in.
 */
export function buildCashFlowSummary(statements: readonly Statement[]): CashFlowSummary | null {
  const [current, previous] = statements;
  if (!current) return null;
  const currentPeriod = sumPeriod(current);
  if (!previous) return { current: currentPeriod, incomeChange: null, expensesChange: null };
  const previousPeriod = sumPeriod(previous);
  return {
    current: currentPeriod,
    incomeChange: percentChange(currentPeriod.income, previousPeriod.income),
    expensesChange: percentChange(currentPeriod.expenses, previousPeriod.expenses),
  };
}

/**
 * The balance delta badge under Home's peso figure. `currentBalance` is the
 * live wallet balance, not a statement figure — it can move mid-session in a
 * way the statements array never will. The newest statement's closing
 * balance is the same figure as the live balance already (nothing has posted
 * since the last close), so "last month" means the statement *before* that
 * one; comparing against the newest statement instead would always read 0%.
 */
export function balanceDeltaFromLastMonth(
  currentBalance: Money,
  statements: readonly Statement[],
): PercentChange | null {
  const previous = statements[1];
  if (!previous) return null;
  return percentChange(currentBalance, previous.closingBalance);
}
