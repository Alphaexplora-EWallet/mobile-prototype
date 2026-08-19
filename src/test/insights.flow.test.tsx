import { describe, expect, it } from "vitest";
import { press, renderApp as start, type TestUser } from "@/test/helpers/renderApp";
import { screen, within } from "@testing-library/react";
import type { BankingTransaction } from "@/core/domain/banking";
import { pesos } from "@/core/money/money";

/**
 * GAP-06: spending insights. The screen must derive the monthly breakdown
 * from the activity feed, and a period with no spend must render the empty
 * state — never a "₱0.00" total or an empty list masquerading as data.
 */

/** Home → Recent transactions → View all → Activity → Spending insights. */
const openInsights = async (user: TestUser) => {
  await press(user, /View all/i);
  await press(user, /Monthly totals/i);
};

/** Minimal transaction fixture; kind is explicit so the test never silently
 * inherits the gateway's kind-from-sign mapping. */
const seed = (input: {
  id: string;
  name: string;
  date: string;
  amount: number;
  kind: BankingTransaction["kind"];
}): BankingTransaction => ({
  id: input.id,
  glyph: "◈",
  name: input.name,
  when: "Just now",
  date: input.date,
  amount: pesos(input.amount),
  kind: input.kind,
  status: "completed",
  reference: `NBK-SEED-${input.id}`,
  description: "",
});

describe("spending insights", () => {
  it("derives the monthly breakdown from the activity feed", async () => {
    const user = start();
    await openInsights(user);

    expect(await screen.findByRole("heading", { name: "Where your money went" })).toBeTruthy();

    // One month of fixtures, so no month selector — the single month is the view.
    expect(screen.queryByRole("group", { name: "Choose a month" })).toBeNull();

    // 160 + 845.75, both card-payment outflows: total and category agree.
    const total = screen.getByRole("region", { name: /Total spent in August 2026/ });
    expect(within(total).getByText("₱1,005.75")).toBeTruthy();

    const categories = screen.getByRole("region", { name: /Spend by category/ });
    expect(within(categories).getByText("Card purchases")).toBeTruthy();
    expect(within(categories).getByText("2 payments")).toBeTruthy();
    expect(within(categories).getByText("₱1,005.75")).toBeTruthy();

    const merchants = screen.getByRole("region", { name: /Spend by merchant/ });
    expect(within(merchants).getByText("FreshMart")).toBeTruthy();
    expect(within(merchants).getByText("Daily Brew")).toBeTruthy();
    expect(within(merchants).getByText("₱845.75")).toBeTruthy();
    expect(within(merchants).getByText("₱160.00")).toBeTruthy();
  });

  it("shows the empty state when the feed has no transactions, never a zero artifact", async () => {
    const user = start({ seedActivity: [] });
    await openInsights(user);

    expect(await screen.findByText(/No transactions yet/)).toBeTruthy();
    expect(screen.queryByText("₱0.00")).toBeNull();
    expect(screen.queryByRole("region", { name: /Spend by category/ })).toBeNull();
    expect(screen.queryByRole("region", { name: /Spend by merchant/ })).toBeNull();
  });

  it("shows the empty state for a month with no spend and recovers on month switch", async () => {
    // August only took money in; July is where the spending happened. The
    // newest month is selected first, so the screen opens on the empty state.
    const user = start({
      seedActivity: [
        seed({ id: "received", name: "Money received", date: "2026-08-10", amount: 2_000, kind: "transfer-in" }),
        seed({ id: "brew", name: "Daily Brew", date: "2026-07-09", amount: -160, kind: "card-payment" }),
      ],
    });
    await openInsights(user);

    expect(await screen.findByText(/Nothing went out in August 2026/)).toBeTruthy();
    expect(screen.queryByText("₱0.00")).toBeNull();
    expect(screen.queryByRole("region", { name: /Spend by category/ })).toBeNull();

    // Switching to July brings the derivation back, still no ₱0.00 anywhere.
    await press(user, /July 2026/);
    expect(await screen.findByRole("region", { name: /Spend by category/ })).toBeTruthy();
    // Total card, category row and merchant row all show the same amount.
    expect(screen.getAllByText("₱160.00").length).toBeGreaterThan(0);
    expect(screen.queryByText("₱0.00")).toBeNull();
  });
});
