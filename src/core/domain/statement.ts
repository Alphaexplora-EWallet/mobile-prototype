import { CURRENCIES, addMoney, type Money } from "../money/money";

/**
 * A statement month and its client-side CSV export.
 *
 * The CSV text is produced here — pure, deterministic and environment-free,
 * exactly like the hand-rolled money formatter — so the web adapter only has
 * to hand bytes to the browser, and a React Native port can reuse the same
 * artifact verbatim. The browser is the *download* seam, not the format seam.
 */

/** One dated movement inside a statement period. */
export type StatementRow = {
  /** Display date inside the period, e.g. "Jul 3, 2026". */
  date: string;
  description: string;
  reference: string;
  /** Signed: negative is money leaving the wallet. */
  amount: Money;
};

export type StatementEntry = StatementRow & {
  /** Running balance after this entry. */
  balance: Money;
};

export type Statement = {
  /** Calendar period, e.g. "2026-07". Also the stable CSV filename key. */
  id: string;
  periodLabel: string;
  generatedLabel: string;
  openingBalance: Money;
  closingBalance: Money;
  /** The exported rows, in statement order. Empty for an empty month. */
  entries: readonly StatementEntry[];
  transactionCount: number;
};

/**
 * Attaches a running balance to every row and derives the closing balance from
 * the opening one, so fixtures can never drift out of reconciliation: opening +
 * Σ entries always equals closing, by construction.
 */
export function buildStatement(input: {
  id: string;
  periodLabel: string;
  generatedLabel: string;
  openingBalance: Money;
  rows: readonly StatementRow[];
}): Statement {
  let running = input.openingBalance;
  const entries = input.rows.map((row) => {
    running = addMoney(running, row.amount);
    return { ...row, balance: running };
  });
  return {
    id: input.id,
    periodLabel: input.periodLabel,
    generatedLabel: input.generatedLabel,
    openingBalance: input.openingBalance,
    closingBalance: entries.length === 0 ? input.openingBalance : entries[entries.length - 1].balance,
    entries,
    transactionCount: entries.length,
  };
}

/**
 * CSV amounts are bare signed decimals — no symbol, no grouping, ASCII minus —
 * because spreadsheet consumers parse numbers, not "₱24,680.50".
 */
const csvMoney = (value: Money): string => {
  const minorUnits = CURRENCIES[value.currency].minorUnits;
  const factor = 10 ** minorUnits;
  const sign = value.amount < 0 ? "-" : "";
  const absolute = Math.abs(value.amount);
  const whole = Math.trunc(absolute / factor).toString();
  const fraction = (absolute % factor).toString().padStart(minorUnits, "0");
  return `${sign}${whole}.${fraction}`;
};

/** Quotes only what a CSV parser would misread: separators, quotes and breaks. */
const csvField = (value: string): string => (/[,;"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/**
 * The exported artifact. Header plus one row per entry, CRLF line endings so
 * Excel does not merge rows, running balance included so the file stands alone.
 * An empty month exports the header only — the UI chooses to show a message
 * instead of delivering that file, but the bytes are still well-formed.
 */
export function statementToCsv(statement: Statement): string {
  const rows = [
    ["Date", "Description", "Reference", "Amount (PHP)", "Balance (PHP)"],
    ...statement.entries.map((entry) => [
      entry.date,
      entry.description,
      entry.reference,
      csvMoney(entry.amount),
      csvMoney(entry.balance),
    ]),
  ];
  return rows.map((row) => row.map(csvField).join(",")).join("\r\n");
}

/** Stable, filesystem-safe download name. */
export const statementFilename = (statement: Statement): string => `fina-statement-${statement.id}.csv`;
