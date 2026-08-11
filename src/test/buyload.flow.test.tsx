import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { createMockNetBankGateway } from "@/platform/web/createMockNetBankGateway";
import App from "../App";

/**
 * Buy load / mobile top-up (GAP-02): pick an operator on the Pay tab, type the
 * mobile number, choose an amount preset, then ride the shared review →
 * confirm → receipt pipeline. The operator→prefix rules block invalid numbers
 * inline, and the receipt only ever shows the masked form.
 */

const start = () => {
  const user = userEvent.setup();
  render(
    <BankingGatewayProvider gateway={createMockNetBankGateway()}>
      <App />
    </BankingGatewayProvider>,
  );
  return user;
};

const press = async (user: ReturnType<typeof userEvent.setup>, name: RegExp | string) =>
  user.click(screen.getByRole("button", { name }));

const openPayTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await press(user, /Start my journey/i);
  await press(user, /^Continue$/);
  await press(user, /Build my plan/i);
  const nav = screen.getByRole("navigation", { name: /primary navigation/i });
  await user.click(within(nav).getByRole("button", { name: /^Pay$/ }));
};

describe("buy load flow", () => {
  it("buys load through the pipeline and masks the number on the receipt", async () => {
    const user = start();
    await openPayTab(user);

    // The Pay tab gains a Buy load section with the operators.
    await press(user, /SmartSmart, TNT & Sun numbers/i);
    expect(await screen.findByRole("heading", { name: "Smart" })).toBeTruthy();

    // A Globe number under Smart is blocked before review.
    await user.type(screen.getByRole("textbox", { name: /Mobile number to load/i }), "09171234567");
    expect(await screen.findByRole("alert")).toHaveTextContent(/not on Smart's network/i);
    expect(screen.getByRole("button", { name: /^Continue$/ })).toBeDisabled();

    // Correcting to a Smart number clears the error; a preset picks the amount.
    await user.clear(screen.getByRole("textbox", { name: /Mobile number to load/i }));
    await user.type(screen.getByRole("textbox", { name: /Mobile number to load/i }), "09981234567");
    expect(screen.queryByRole("alert")).toBeNull();
    await press(user, /^₱300$/);

    await press(user, /^Continue$/);
    expect(await screen.findByText("Review load")).toBeTruthy();
    expect(screen.getByText("to Smart")).toBeTruthy();
    // The number is masked even on review.
    expect(screen.getByText("09••• •••567")).toBeTruthy();

    // ₱300 is under the step-up threshold, so it confirms directly.
    await press(user, /Confirm and buy/i);
    expect(await screen.findByRole("heading", { name: /Load purchased/i })).toBeTruthy();
    expect(screen.getByText("Bought Smart load")).toBeTruthy();
    expect(screen.getByText(/NBK-LOD-000001/)).toBeTruthy();
    // The receipt copy shows the masked number, never the raw one.
    expect(screen.getByText(/Smart load for 09••• •••567/)).toBeTruthy();
    expect(screen.queryByText(/09981234567/)).toBeNull();

    // Balance debited: ₱24,680.50 − ₱300.00 = ₱24,380.50.
    await press(user, /^Done$/);
    expect(await screen.findByText("₱24,380.50")).toBeTruthy();
  });

  it("blocks an incomplete number with an inline error", async () => {
    const user = start();
    await openPayTab(user);
    await press(user, /GlobeGlobe & TM numbers/i);

    await user.type(screen.getByRole("textbox", { name: /Mobile number to load/i }), "0917");
    expect(await screen.findByRole("alert")).toHaveTextContent(/11 digits, starting with 09/i);
    expect(screen.getByRole("button", { name: /^Continue$/ })).toBeDisabled();

    // Twelve digits are just as blocked as four.
    await user.type(screen.getByRole("textbox", { name: /Mobile number to load/i }), "12345678");
    expect(await screen.findByRole("alert")).toHaveTextContent(/11 digits/i);
  });

  it("files a load purchase in activity", async () => {
    const user = start();
    await openPayTab(user);
    await press(user, /DITODITO numbers/i);

    await user.type(screen.getByRole("textbox", { name: /Mobile number to load/i }), "09911234567");
    await press(user, /^₱100$/);
    await press(user, /^Continue$/);
    expect(await screen.findByText("Review load")).toBeTruthy();

    await press(user, /Confirm and buy/i);
    expect(await screen.findByRole("heading", { name: /Load purchased/i })).toBeTruthy();

    await press(user, /View activity/i);
    expect(await screen.findByRole("heading", { name: /Bought DITO load/i })).toBeTruthy();
    expect(screen.getByText(/DITO load for 09••• •••567/)).toBeTruthy();
  });

  it("keeps the draft when going back from review", async () => {
    const user = start();
    await openPayTab(user);
    await press(user, /SmartSmart, TNT & Sun numbers/i);

    await user.type(screen.getByRole("textbox", { name: /Mobile number to load/i }), "09991234567");
    await press(user, /^₱500$/);
    await press(user, /^Continue$/);
    expect(await screen.findByText("Review load")).toBeTruthy();

    await press(user, /Back to home/i);
    expect(screen.getByRole("textbox", { name: /Mobile number to load/i })).toHaveValue("09991234567");
    expect(screen.getByRole("button", { name: /^₱500$/ })).toHaveAttribute("aria-pressed", "true");
  });
});
