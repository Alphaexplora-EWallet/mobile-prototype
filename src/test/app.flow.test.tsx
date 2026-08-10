import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

/**
 * Golden snapshot of the pre-restructure monolith.
 *
 * This walks every screen and the complete quest flow, snapshotting the
 * rendered DOM at each stop. It is the ground truth for the MVVM migration:
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
    await click(/Continue quest/i);
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

  it("opens and dismisses the simulated action sheet", async () => {
    render(<App />);
    await click(/Start my journey/i);
    await click(/^Continue$/);
    await click(/Build my plan/i);

    await click(/Daily Brew/i);
    const sheet = screen.getByRole("dialog", { name: /Daily Brew/i });
    expect(within(sheet).getByText(/safely simulated/i)).toBeTruthy();

    await click(/Got it/i);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
