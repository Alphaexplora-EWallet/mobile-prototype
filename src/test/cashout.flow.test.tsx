import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { MOCK_TRANSACTION_PIN } from "@/core/data/mock/security.mock";
import { createMockNetBankGateway, type MockGatewayOptions } from "@/platform/web/createMockNetBankGateway";
import App from "../App";

/**
 * Cash-out / withdraw to bank (GAP-01): a verified wallet moves money out to a
 * saved bank account over InstaPay, with the fee, a receipt carrying the
 * withdrawal reference, and the two blocked paths — insufficient balance and
 * the per-tier daily cap — surfacing through the existing error surface.
 */

const start = (options: MockGatewayOptions = {}) => {
  const user = userEvent.setup();
  render(
    <BankingGatewayProvider gateway={createMockNetBankGateway(options)}>
      <App />
    </BankingGatewayProvider>,
  );
  return user;
};

const press = async (user: ReturnType<typeof userEvent.setup>, name: RegExp | string) =>
  user.click(screen.getByRole("button", { name }));

/** Onboards to Home, opens the Wallet tab, then the Cash out row. */
const openCashOut = async (user: ReturnType<typeof userEvent.setup>) => {
  await press(user, /Start my journey/i);
  await press(user, /^Continue$/);
  await press(user, /Build my plan/i);
  const nav = screen.getByRole("navigation", { name: /primary navigation/i });
  await user.click(within(nav).getByRole("button", { name: /^Wallet$/ }));
  await press(user, /^Cash out/);
};

describe("cash-out flow", () => {
  it("withdraws to a saved bank account over InstaPay, with the fee", async () => {
    const user = start();
    await openCashOut(user);

    // BPI Savings is preselected; the strip previews the rail's fee.
    await user.type(screen.getByRole("textbox", { name: /Amount to withdraw/i }), "1000");
    expect(screen.getByText("Fee ₱15.00")).toBeTruthy();
    expect(screen.getByText(/Arrives in seconds over InstaPay/i)).toBeTruthy();

    await press(user, /^Continue$/);

    expect(await screen.findByText("Review withdrawal")).toBeTruthy();
    const summary = screen.getByRole("region", { name: /Payment summary/i });
    expect(within(summary).getByText("Main wallet •••• 8421")).toBeTruthy();
    expect(within(summary).getByText("InstaPay")).toBeTruthy();
    expect(within(summary).getByText("₱15.00")).toBeTruthy();
    expect(within(summary).getByText("₱1,015.00")).toBeTruthy();

    // Money leaving to an external bank is irreversible, so it always steps up.
    await press(user, /Continue to confirm/i);
    await user.type(screen.getByLabelText(/Transaction PIN/i), MOCK_TRANSACTION_PIN);
    await press(user, /Confirm payment/i);

    expect(await screen.findByRole("heading", { name: /Withdrawal complete/i })).toBeTruthy();
    expect(screen.getByText("Withdrawn to BPI Savings")).toBeTruthy();
    expect(screen.getByText(/NBK-WDR-000001/)).toBeTruthy();

    // Balance debited: ₱24,680.50 − ₱1,015.00 = ₱23,665.50.
    await press(user, /^Done$/);
    expect(await screen.findByText("₱23,665.50")).toBeTruthy();
  });

  it("files a cash-out transaction in activity", async () => {
    const user = start();
    await openCashOut(user);
    await user.type(screen.getByRole("textbox", { name: /Amount to withdraw/i }), "2000");
    await press(user, /^Continue$/);
    await press(user, /Continue to confirm/i);
    await user.type(screen.getByLabelText(/Transaction PIN/i), MOCK_TRANSACTION_PIN);
    await press(user, /Confirm payment/i);
    expect(await screen.findByRole("heading", { name: /Withdrawal complete/i })).toBeTruthy();

    await press(user, /View activity/i);
    expect(await screen.findByRole("heading", { name: /Withdrawn to BPI Savings/i })).toBeTruthy();
  });

  it("blocks a withdrawal larger than the wallet holds", async () => {
    const user = start();
    await openCashOut(user);
    // ₱30,000 from a wallet holding ₱24,680.50 — over the amount + fee.
    await user.type(screen.getByRole("textbox", { name: /Amount to withdraw/i }), "30000");
    await press(user, /^Continue$/);

    expect(await screen.findByRole("alert")).toHaveTextContent(/more than this wallet holds/i);
    expect(screen.getByRole("button", { name: /Continue to confirm/i })).toBeDisabled();
    expect(screen.queryByRole("heading", { name: /Withdrawal complete/i })).toBeNull();
  });

  it("blocks a withdrawal over the daily InstaPay limit for the tier", async () => {
    const user = start();
    await openCashOut(user);
    // Verified tier: ₱50,000 daily, ₱2,500 already used today → ₱48,000 passes
    // the per-transaction cap but not the daily one.
    await user.type(screen.getByRole("textbox", { name: /Amount to withdraw/i }), "48000");
    await press(user, /^Continue$/);

    expect(await screen.findByRole("alert")).toHaveTextContent(/would pass your ₱50,000/i);
    expect(screen.getByRole("button", { name: /Continue to confirm/i })).toBeDisabled();
  });

  it("keeps the cash-out draft when going back from review", async () => {
    const user = start();
    await openCashOut(user);
    await user.type(screen.getByRole("textbox", { name: /Amount to withdraw/i }), "750");
    await press(user, /GCash/);
    await press(user, /^Continue$/);
    expect(await screen.findByText("Review withdrawal")).toBeTruthy();
    expect(screen.getByText(/to GCash/)).toBeTruthy();

    await press(user, /Back to home/i);
    expect(screen.getByRole("textbox", { name: /Amount to withdraw/i })).toHaveValue("750");
    expect(screen.getByRole("button", { name: /^GCash/ })).toHaveAttribute("aria-pressed", "true");
  });
});
