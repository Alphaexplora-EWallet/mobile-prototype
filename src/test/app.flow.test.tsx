import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { createMockNetBankGateway } from "@/platform/web/createMockNetBankGateway";
import App from "../App";

/**
 * Golden snapshot of the pre-restructure monolith.
 *
 * A representative walk, not an exhaustive one: 15 snapshot stops across 12
 * screens — onboarding, the full quest flow, the money screens, and four of
 * the five tabs (the Quest tab is covered by the quest-flow stops). The screen
 * map has since grown to 47 screens (ScreenParams in core/navigation/screens.ts).
 * It is the ground truth for the MVVM migration:
 * every subsequent step must keep these green WITHOUT regenerating them.
 * Running `vitest -u` discards the only proof that the restructure preserved
 * behaviour. Don't.
 */

const click = async (name: RegExp | string) => {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name }));
};

/**
 * Collapses asset URLs to their filename so the snapshot tracks *which* image
 * is rendered, not where the bundler happens to serve it from. Without this,
 * relocating a file inside src/ shows up as a diff on every screen that uses
 * it and drowns out real changes.
 */
const normalize = (html: string) => html.replace(/src="[^"]*\/([^/"]+\.(?:webp|png|jpe?g|svg))"/g, 'src="asset:$1"');

const snap = (container: HTMLElement, name: string) => expect(normalize(container.innerHTML)).toMatchSnapshot(name);

describe("FIN-A app flow", () => {
  it("renders every screen and the full quest flow identically", async () => {
    const { container } = render(<App />);

    // ---- Onboarding -------------------------------------------------------
    snap(container, "01-welcome");
    expect(screen.queryByRole("navigation", { name: /primary navigation/i })).toBeNull();

    await click(/I already have an account/i);
    snap(container, "02-sign-in");

    await click(/Back to welcome/i);
    await click(/Start my journey/i);
    snap(container, "03-quiz");
    expect(screen.queryByRole("navigation", { name: /primary navigation/i })).toBeNull();

    await click(/I check my budget first/i);
    await click(/^Continue$/);
    snap(container, "04-result");

    await click(/Build my plan/i);
    snap(container, "05-home");
    expect(screen.getByRole("navigation", { name: /primary navigation/i })).toBeTruthy();

    // ---- Balance masking --------------------------------------------------
    expect(screen.getByText("₱24,680.50")).toBeTruthy();
    await click(/Hide Main wallet balance/i);
    expect(screen.getByText("₱••,•••.••")).toBeTruthy();
    await click(/Show Main wallet balance/i);
    expect(screen.getByText("₱24,680.50")).toBeTruthy();

    // ---- Quest flow -------------------------------------------------------
    await click(/View goal details/i);
    snap(container, "06-quest-available");

    await click(/Set ₱3,000 limit/i);
    snap(container, "07-wallet-limit-setup");

    await click(/Confirm ₱3,000 limit/i);
    snap(container, "08-quest-tracking");

    await click(/Preview end-of-day result/i);
    snap(container, "09-reward");

    await click(/Use this card style/i);
    snap(container, "10-wallet-after-reward");
    expect(screen.getAllByText(/Sunset Ride/).length).toBeGreaterThan(0);

    // ---- Money screens ----------------------------------------------------
    await click(/Send money/i);
    snap(container, "11-transfer");

    await click(/Back to home/i);
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    await userEvent.setup().click(within(nav).getByRole("button", { name: /^Pay$/ }));
    snap(container, "12-payments");

    await click(/Add money/i);
    snap(container, "13-deposit");

    // ---- Remaining tabs ---------------------------------------------------
    await click(/Back to home/i);
    await userEvent.setup().click(within(nav).getByRole("button", { name: /^Wallet$/ }));
    snap(container, "14-wallet");

    await userEvent.setup().click(within(nav).getByRole("button", { name: /^Profile$/ }));
    snap(container, "15-profile");
  });

  /**
   * Retargeted twice as the prototype grew real: first from "Add recipient",
   * then from the Pay screen's QR card, both of which now lead somewhere.
   * "Share receipt" is the durable target — handing a receipt to another app
   * needs a Share port this codebase has no web global to reach for.
   */
  it("opens and dismisses the simulated action sheet", async () => {
    const user = userEvent.setup();
    render(
      <BankingGatewayProvider gateway={createMockNetBankGateway()}>
        <App />
      </BankingGatewayProvider>,
    );
    await click(/Start my journey/i);
    await click(/^Continue$/);
    await click(/Build my plan/i);

    await click(/^Send$/);
    await user.type(screen.getByRole("textbox", { name: /Amount to send/i }), "500");
    await click(/^Continue$/);
    await click(/Confirm and send/i);
    expect(await screen.findByRole("heading", { name: /Transfer complete/i })).toBeTruthy();

    await click(/Share receipt/i);
    const sheet = screen.getByRole("dialog", { name: /Share receipt/i });
    expect(within(sheet).getByText(/safely simulated/i)).toBeTruthy();

    await click(/Got it/i);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("creates a NetBank sandbox receipt and exposes its transaction", async () => {
    const user = userEvent.setup();
    render(
      <BankingGatewayProvider gateway={createMockNetBankGateway()}>
        <App />
      </BankingGatewayProvider>,
    );

    await user.click(screen.getByRole("button", { name: /Start my journey/i }));
    await user.click(screen.getByRole("button", { name: /^Continue$/ }));
    await user.click(screen.getByRole("button", { name: /Build my plan/i }));
    await user.click(screen.getByRole("button", { name: /^Send$/ }));
    await user.type(screen.getByRole("textbox", { name: /Amount to send/i }), "500");
    await user.click(screen.getByRole("button", { name: /^Continue$/ }));

    expect(screen.getByText("Review transfer")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Confirm and send/i }));

    expect(await screen.findByRole("heading", { name: /Transfer complete/i })).toBeTruthy();
    expect(screen.getByText(/NBK-TRF-000001/i)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /View activity/i }));
    expect(await screen.findByRole("heading", { name: "Sent to Jomar D." })).toBeTruthy();
  });
});
