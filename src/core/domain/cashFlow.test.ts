import { describe, expect, it } from "vitest";
import { balanceDeltaFromLastMonth, buildCashFlowSummary, percentChange } from "./cashFlow";
import { MOCK_STATEMENTS } from "../data/mock/compliance.mock";
import { buildStatement } from "./statement";
import { pesos } from "../money/money";

/**
 * ALP-42: Home's Cash flow card and balance delta badge are both derivations
 * over the same reconciled `Statement` rows the statement export already
 * trusts — no new fixture ledger, no second source of truth to drift from.
 */

describe("percentChange", () => {
  it("computes a signed whole percent and its direction", () => {
    expect(percentChange(pesos(110), pesos(100))).toEqual({ percent: 10, direction: "up" });
    expect(percentChange(pesos(90), pesos(100))).toEqual({ percent: -10, direction: "down" });
  });

  it("is null off a zero base — nothing to compare against, not 0%", () => {
    expect(percentChange(pesos(100), pesos(0))).toBeNull();
  });

  it("rounds to flat when the move is under half a percent", () => {
    expect(percentChange(pesos(100.2), pesos(100))).toEqual({ percent: 0, direction: "flat" });
  });
});

describe("buildCashFlowSummary", () => {
  it("splits a period into income and expenses, both non-negative", () => {
    const july = buildStatement({
      id: "2026-07",
      periodLabel: "July 2026",
      generatedLabel: "Generated Aug 1, 2026",
      openingBalance: pesos(1_000),
      rows: [
        { date: "Jul 2, 2026", description: "Salary", reference: "R1", amount: pesos(5_000) },
        { date: "Jul 3, 2026", description: "Rent", reference: "R2", amount: pesos(-2_000) },
      ],
    });

    const summary = buildCashFlowSummary([july]);

    expect(summary?.current.income).toEqual(pesos(5_000));
    expect(summary?.current.expenses).toEqual(pesos(2_000));
    expect(summary?.incomeChange).toBeNull();
    expect(summary?.expensesChange).toBeNull();
  });

  it("compares the current period against the one before it", () => {
    const previous = buildStatement({
      id: "2026-06",
      periodLabel: "June 2026",
      generatedLabel: "Generated Jul 1, 2026",
      openingBalance: pesos(0),
      rows: [{ date: "Jun 2, 2026", description: "Salary", reference: "R1", amount: pesos(20_000) }],
    });
    const current = buildStatement({
      id: "2026-07",
      periodLabel: "July 2026",
      generatedLabel: "Generated Aug 1, 2026",
      openingBalance: pesos(20_000),
      rows: [{ date: "Jul 2, 2026", description: "Salary", reference: "R1", amount: pesos(18_000) }],
    });

    const summary = buildCashFlowSummary([current, previous]);

    expect(summary?.incomeChange).toEqual({ percent: -10, direction: "down" });
  });

  it("derives no summary for an empty feed", () => {
    expect(buildCashFlowSummary([])).toBeNull();
  });

  it("matches the reconciled July-vs-June figures in MOCK_STATEMENTS", () => {
    const summary = buildCashFlowSummary(MOCK_STATEMENTS);

    expect(summary?.current.periodLabel).toBe("July 2026");
    expect(summary?.current.income).toEqual(pesos(18_000));
    expect(summary?.current.expenses).toEqual(pesos(15_259.75));
    expect(summary?.incomeChange).toEqual({ percent: -10, direction: "down" });
    expect(summary?.expensesChange).toEqual({ percent: -6, direction: "down" });
  });
});

describe("balanceDeltaFromLastMonth", () => {
  it("is null with fewer than two statements — no prior month to compare against", () => {
    expect(balanceDeltaFromLastMonth(pesos(1_000), [MOCK_STATEMENTS[0]])).toBeNull();
    expect(balanceDeltaFromLastMonth(pesos(1_000), [])).toBeNull();
  });

  it("compares the live balance to the statement before the newest one", () => {
    // MOCK_STATEMENTS: July closing (₱24,680.50) reconciles to the live main
    // card balance; June closing is ₱21,940.25 — a ~12% rise, the figure the
    // reference design's badge shows.
    expect(balanceDeltaFromLastMonth(pesos(24_680.5), MOCK_STATEMENTS)).toEqual({ percent: 12, direction: "up" });
  });
});
