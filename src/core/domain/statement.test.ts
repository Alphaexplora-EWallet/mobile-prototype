import { describe, expect, it } from "vitest";
import { MOCK_STATEMENTS } from "../data/mock/compliance.mock";
import { money } from "../money/money";
import { buildStatement, statementFilename, statementToCsv, type StatementRow } from "./statement";

const row = (
  amount: number,
  description = "Daily Brew",
  date = "Jul 9, 2026",
  reference = "NBK-2026-0705",
): StatementRow => ({
  date,
  description,
  reference,
  amount: money(Math.round(amount * 100)),
});

describe("buildStatement", () => {
  it("attaches a running balance and derives the closing balance", () => {
    const statement = buildStatement({
      id: "2026-07",
      periodLabel: "July 2026",
      generatedLabel: "Generated Aug 1, 2026",
      openingBalance: money(2_194_025),
      rows: [row(15_000, "Funds received — salary", "Jul 2, 2026"), row(-1_250, "Sent to Jomar D.", "Jul 3, 2026")],
    });

    expect(statement.entries.map((entry) => entry.balance.amount)).toEqual([3_694_025, 3_569_025]);
    expect(statement.closingBalance.amount).toBe(3_569_025);
    expect(statement.transactionCount).toBe(2);
  });

  it("keeps the opening balance as closing for an empty month", () => {
    const statement = buildStatement({
      id: "2026-04",
      periodLabel: "April 2026",
      generatedLabel: "Generated May 1, 2026",
      openingBalance: money(1_600_275),
      rows: [],
    });

    expect(statement.entries).toEqual([]);
    expect(statement.closingBalance.amount).toBe(1_600_275);
    expect(statement.transactionCount).toBe(0);
  });
});

describe("statementToCsv", () => {
  const statement = buildStatement({
    id: "2026-07",
    periodLabel: "July 2026",
    generatedLabel: "Generated Aug 1, 2026",
    openingBalance: money(2_194_025),
    rows: [
      row(15_000, "Funds received — salary", "Jul 2, 2026", "NBK-2026-0701"),
      row(-845.75, "FreshMart, Megamall branch", "Jul 14, 2026", "NBK-2026-0707"),
    ],
  });

  it("emits a header plus one line per entry, CRLF terminated", () => {
    expect(statementToCsv(statement)).toBe(
      "Date,Description,Reference,Amount (PHP),Balance (PHP)\r\n" +
        '"Jul 2, 2026",Funds received — salary,NBK-2026-0701,15000.00,36940.25\r\n' +
        '"Jul 14, 2026","FreshMart, Megamall branch",NBK-2026-0707,-845.75,36094.50',
    );
  });

  it("uses bare signed decimals — no symbol, no grouping, ASCII minus", () => {
    expect(statementToCsv(statement)).not.toContain("₱");
    expect(statementToCsv(statement)).not.toContain("−");
    expect(statementToCsv(statement)).toContain("-845.75");
  });

  it("quotes fields a parser would misread and doubles embedded quotes", () => {
    const tricky = buildStatement({
      id: "2026-07",
      periodLabel: "July 2026",
      generatedLabel: "Generated Aug 1, 2026",
      openingBalance: money(0),
      rows: [row(-100, 'He said "thank you", then left')],
    });
    expect(statementToCsv(tricky)).toContain('"He said ""thank you"", then left"');
  });

  it("exports a well-formed header for an empty month", () => {
    const empty = buildStatement({
      id: "2026-04",
      periodLabel: "April 2026",
      generatedLabel: "Generated May 1, 2026",
      openingBalance: money(1_600_275),
      rows: [],
    });
    expect(statementToCsv(empty)).toBe("Date,Description,Reference,Amount (PHP),Balance (PHP)");
  });
});

describe("statementFilename", () => {
  it("derives a filesystem-safe name from the period id", () => {
    const statement = buildStatement({
      id: "2026-07",
      periodLabel: "July 2026",
      generatedLabel: "Generated Aug 1, 2026",
      openingBalance: money(0),
      rows: [],
    });
    expect(statementFilename(statement)).toBe("fina-statement-2026-07.csv");
  });
});

describe("MOCK_STATEMENTS", () => {
  it("every month reconciles: opening plus rows equals closing", () => {
    for (const statement of MOCK_STATEMENTS) {
      const sum = statement.entries.reduce((total, entry) => total + entry.amount.amount, 0);
      expect(statement.openingBalance.amount + sum).toBe(statement.closingBalance.amount);
      expect(statement.transactionCount).toBe(statement.entries.length);
    }
  });

  it("each running balance follows the previous one", () => {
    for (const statement of MOCK_STATEMENTS) {
      let expected = statement.openingBalance.amount;
      for (const entry of statement.entries) {
        expected += entry.amount.amount;
        expect(entry.balance.amount).toBe(expected);
      }
    }
  });

  it("April 2026 is the empty month the UI must handle", () => {
    const april = MOCK_STATEMENTS.find((statement) => statement.id === "2026-04");
    expect(april?.transactionCount).toBe(0);
    expect(april?.closingBalance.amount).toBe(april?.openingBalance.amount);
  });
});
