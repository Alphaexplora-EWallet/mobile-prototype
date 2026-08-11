import { describe, expect, it } from "vitest";
import type { BankingTransaction } from "./banking";
import { pesos } from "../money/money";
import { buildMonthSpend, monthIdOf, monthLabel, spendMonths } from "./spendingInsights";

/**
 * GAP-06: the derivation is the feature. Grouping and totals must stay pure,
 * integer-centavo and NaN-free; a period with no transactions must derive an
 * empty result (never zero/NaN artifacts) and let the UI show an empty state.
 */

/** Minimal fixture, amounts in major pesos; default status completed. */
const transaction = (input: {
  id: string;
  kind: BankingTransaction["kind"];
  name: string;
  date: string;
  amount: number;
  status?: BankingTransaction["status"];
}): BankingTransaction => ({
  id: input.id,
  glyph: "◈",
  name: input.name,
  when: "Just now",
  date: input.date,
  amount: pesos(input.amount),
  kind: input.kind,
  status: input.status ?? "completed",
  reference: `REF-${input.id}`,
  description: "",
});

describe("month helpers", () => {
  it("slices an ISO date down to its calendar month", () => {
    expect(monthIdOf("2026-08-11")).toBe("2026-08");
  });

  it("labels a month id without Intl", () => {
    expect(monthLabel("2026-08")).toBe("August 2026");
    expect(monthLabel("2026-01")).toBe("January 2026");
  });

  it("lists the months present in the data, newest first", () => {
    const transactions = [
      transaction({ id: "a", kind: "card-payment", name: "A", date: "2026-07-03", amount: -100 }),
      transaction({ id: "b", kind: "card-payment", name: "B", date: "2026-08-11", amount: -50 }),
      transaction({ id: "c", kind: "transfer-in", name: "C", date: "2026-08-10", amount: 500 }),
      transaction({ id: "d", kind: "card-payment", name: "D", date: "2026-06-20", amount: -25 }),
    ];
    expect(spendMonths(transactions)).toEqual(["2026-08", "2026-07", "2026-06"]);
  });

  it("returns no months for an empty feed", () => {
    expect(spendMonths([])).toEqual([]);
  });
});

describe("buildMonthSpend", () => {
  it("groups outflows by category with totals and counts in integer centavos", () => {
    const transactions = [
      transaction({ id: "brew-1", kind: "card-payment", name: "Daily Brew", date: "2026-08-11", amount: -160 }),
      transaction({ id: "brew-2", kind: "card-payment", name: "Daily Brew", date: "2026-08-10", amount: -160 }),
      transaction({ id: "meralco", kind: "bill-payment", name: "Meralco", date: "2026-08-09", amount: -2_340 }),
      transaction({ id: "qr", kind: "qr-payment", name: "Kape't Tambay", date: "2026-08-08", amount: -415 }),
    ];

    const spend = buildMonthSpend(transactions, "2026-08");

    expect(spend.totalSpent).toEqual(pesos(3_075));
    expect(spend.categories.map(({ key, count, total }) => ({ key, count, total }))).toEqual([
      { key: "bill-payment", count: 1, total: pesos(2_340) },
      { key: "qr-payment", count: 1, total: pesos(415) },
      { key: "card-payment", count: 2, total: pesos(320) },
    ]);
    // Biggest first: 2,340 / 415 / 320 — count (2) loses to amount (415 > 320).
    expect(spend.categories[2].label).toBe("Card purchases");
  });

  it("groups outflows by merchant, merging the same name across kinds", () => {
    const transactions = [
      transaction({ id: "brew-1", kind: "card-payment", name: "Daily Brew", date: "2026-08-11", amount: -160 }),
      transaction({ id: "qr", kind: "qr-payment", name: "Daily Brew", date: "2026-08-08", amount: -185 }),
    ];

    const spend = buildMonthSpend(transactions, "2026-08");

    expect(spend.merchants).toEqual([
      { key: "Daily Brew", label: "Daily Brew", glyph: "◈", count: 2, total: pesos(345) },
    ]);
  });

  it("excludes incoming money from the totals and the groups", () => {
    const transactions = [
      transaction({ id: "out", kind: "card-payment", name: "FreshMart", date: "2026-08-10", amount: -845.75 }),
      transaction({ id: "in-1", kind: "transfer-in", name: "Money received", date: "2026-08-10", amount: 2_000 }),
      transaction({ id: "in-2", kind: "cash-in", name: "Added via 7-Eleven", date: "2026-08-09", amount: 1_000 }),
    ];

    const spend = buildMonthSpend(transactions, "2026-08");

    expect(spend.totalSpent).toEqual(pesos(845.75));
    expect(spend.transactionCount).toBe(3);
    expect(spend.categories).toHaveLength(1);
    expect(spend.categories[0].key).toBe("card-payment");
    expect(spend.merchants.map((group) => group.label)).toEqual(["FreshMart"]);
  });

  it("keeps other months out of the breakdown", () => {
    const transactions = [
      transaction({ id: "july", kind: "card-payment", name: "Daily Brew", date: "2026-07-09", amount: -160 }),
      transaction({ id: "august", kind: "card-payment", name: "Daily Brew", date: "2026-08-09", amount: -160 }),
    ];

    const july = buildMonthSpend(transactions, "2026-07");
    const august = buildMonthSpend(transactions, "2026-08");

    expect(july.totalSpent).toEqual(pesos(160));
    expect(august.totalSpent).toEqual(pesos(160));
    expect(july.transactionCount).toBe(1);
    expect(august.transactionCount).toBe(1);
  });

  it("keeps returned transfers out of spend — refunded money is not spend", () => {
    const transactions = [
      transaction({ id: "brew", kind: "card-payment", name: "Daily Brew", date: "2026-08-11", amount: -160 }),
      transaction({
        id: "bounced",
        kind: "transfer-out",
        name: "Sent to Jomar D.",
        date: "2026-08-09",
        amount: -1_250,
        status: "returned",
      }),
    ];

    const spend = buildMonthSpend(transactions, "2026-08");

    expect(spend.totalSpent).toEqual(pesos(160));
    expect(spend.transactionCount).toBe(2);
    expect(spend.merchants.map((group) => group.label)).toEqual(["Daily Brew"]);
  });

  it("derives an empty result for a period with no transactions — no zero/NaN artifacts", () => {
    const transactions = [
      transaction({ id: "july", kind: "card-payment", name: "Daily Brew", date: "2026-07-09", amount: -160 }),
    ];

    const spend = buildMonthSpend(transactions, "2026-08");

    expect(spend.totalSpent).toEqual(pesos(0));
    expect(Number.isNaN(spend.totalSpent.amount)).toBe(false);
    expect(spend.categories).toEqual([]);
    expect(spend.merchants).toEqual([]);
    expect(spend.transactionCount).toBe(0);
  });

  it("derives an empty result for a month that only took money in", () => {
    const transactions = [
      transaction({ id: "in", kind: "transfer-in", name: "Money received", date: "2026-08-10", amount: 2_000 }),
    ];

    const spend = buildMonthSpend(transactions, "2026-08");

    expect(spend.totalSpent).toEqual(pesos(0));
    expect(spend.categories).toEqual([]);
    expect(spend.merchants).toEqual([]);
    // The distinction the empty state needs: transactions existed, spend did not.
    expect(spend.transactionCount).toBe(1);
  });

  it("reconciles: category totals always sum to the month total", () => {
    const transactions = [
      transaction({ id: "brew", kind: "card-payment", name: "Daily Brew", date: "2026-08-11", amount: -160 }),
      transaction({ id: "meralco", kind: "bill-payment", name: "Meralco", date: "2026-08-09", amount: -2_340 }),
      transaction({ id: "qr", kind: "qr-payment", name: "Kape't Tambay", date: "2026-08-08", amount: -415 }),
    ];

    const spend = buildMonthSpend(transactions, "2026-08");
    const sum = spend.categories.reduce((total, group) => total + group.total.amount, 0);

    expect(sum).toBe(spend.totalSpent.amount);
  });

  it("is a pure function: the input array is not mutated", () => {
    const transactions = [
      transaction({ id: "brew", kind: "card-payment", name: "Daily Brew", date: "2026-08-11", amount: -160 }),
    ];
    const snapshot = [...transactions];

    buildMonthSpend(transactions, "2026-08");
    spendMonths(transactions);

    expect(transactions).toEqual(snapshot);
  });
});
