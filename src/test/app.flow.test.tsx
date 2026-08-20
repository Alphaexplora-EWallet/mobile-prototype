import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { createMockNetBankGateway } from "@/platform/web/createMockNetBankGateway";
import { MOCK_MPIN, MOCK_OTP_CODE } from "@/core/data/mock/security.mock";
import { press, renderSignedOut, seedSignedIn, seedSignedOut } from "@/test/helpers/renderApp";
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
 *
 * One stop, `02-sign-in`, was regenerated once and deliberately, when signing in
 * became real: the screen collected an email and a password that nothing read,
 * and now collects the mobile number the account is keyed by and the MPIN. The
 * registration screens that did not exist before are new stops (`02a`-`02d`,
 * `04a`) rather than renumberings of the old ones, so every capture from
 * `03-quiz` onward is still the original and still has to match it exactly.
 *
 * The walk reaches Home by seeding a session rather than by registering, because
 * this test renders `<App />` with no gateway provider — deliberately, since the
 * *unavailable* gateway is what proves these screens render without a backend.
 * Registration needs a gateway to answer, so it is snapshotted separately below.
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
    seedSignedOut();
    const { container } = render(<App />);

    // ---- Signed out -------------------------------------------------------
    snap(container, "01-welcome");
    expect(screen.queryByRole("navigation", { name: /primary navigation/i })).toBeNull();

    await click(/I already have an account/i);
    snap(container, "02-sign-in");

    await click(/Back to welcome/i);
    await click(/Start my journey/i);
    snap(container, "02a-sign-up");
    // No tab bar exists to leave the auth stack with.
    expect(screen.queryByRole("navigation", { name: /primary navigation/i })).toBeNull();

    // ---- Signed in --------------------------------------------------------
    // The gate shows the tab shell as soon as a session exists; the stack still
    // says `sign-up`, which is exactly what the gate is for.
    seedSignedIn();
    // `findBy` because the store write happens outside React's event loop here;
    // the gate re-renders on the next tick rather than synchronously.
    const nav0 = await screen.findByRole("navigation", { name: /primary navigation/i });
    await userEvent.setup().click(within(nav0).getByRole("button", { name: /^Profile$/ }));
    await click(/Retake the quiz/i);
    snap(container, "03-quiz");

    await click(/I check my budget first/i);
    await click(/^Continue$/);
    snap(container, "04-result");

    // "Build my plan" now goes where the plan is — the Quest tab, a limit to set
    // and track. It used to run the same resetTo("home") as the close ×, so two
    // controls did one thing and the plan was never shown.
    await click(/Build my plan/i);
    expect(screen.getByRole("heading", { name: /Keep today intentional/i })).toBeTruthy();

    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    expect(nav).toBeTruthy();
    await userEvent.setup().click(within(nav).getByRole("button", { name: /^Home$/ }));
    snap(container, "05-home");

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

    // Scan is a Home action now, not a tab: the tab it held duplicated Home's
    // own quick actions, and Activity — which had no tab at all — has the slot.
    await click(/Back to home/i);
    await click(/^Scan$/);
    snap(container, "12-payments");

    await click(/Payment options/i);
    await click(/Add money/i);
    snap(container, "13-deposit");

    // ---- Remaining tabs ---------------------------------------------------
    // Activity holds the third tab slot now. It is not snapshotted here because
    // it loads from the gateway and would capture a loading state; insights.flow
    // covers it. The tab bar in every snapshot below is the evidence it is there.
    await click(/Back to home/i);
    // Re-queried, not reused: Scan has no tab bar, so the nav above was
    // unmounted and the old node would swallow clicks while detached.
    const tabs = screen.getByRole("navigation", { name: /primary navigation/i });
    await userEvent.setup().click(within(tabs).getByRole("button", { name: /^Wallet$/ }));
    snap(container, "14-wallet");

    await userEvent.setup().click(within(tabs).getByRole("button", { name: /^Profile$/ }));
    snap(container, "15-profile");
  });

  /**
   * Registration, snapshotted apart from the golden walk because every step
   * needs the gateway to answer — a code to send, a number to claim, an account
   * to create. New stops, so nothing above is renumbered.
   */
  it("renders the registration flow it now really has", async () => {
    const { user, view } = renderSignedOut();
    const { container } = view;
    await press(user, /Start my journey/i);

    await user.type(screen.getByRole("textbox", { name: /Mobile number/i }), "09171234567");
    await user.click(screen.getByRole("switch", { name: /Terms and Privacy/i }));
    await press(user, /Send me a code/i);
    snap(container, "02b-auth-otp");

    await user.type(screen.getByLabelText(/One-time code/i), MOCK_OTP_CODE);
    await press(user, /Verify code/i);
    await user.type(screen.getByRole("textbox", { name: /Full name/i }), "Ana Reyes");
    snap(container, "02c-sign-up-profile");

    await press(user, /^Continue$/);
    snap(container, "02d-sign-up-pin");

    await user.type(screen.getByLabelText(/New MPIN/i), MOCK_MPIN);
    await user.type(screen.getByLabelText(/Confirm MPIN/i), MOCK_MPIN);
    await press(user, /Create my wallet/i);

    // Quiz → result → the verification prompt a new wallet lands on.
    expect(await screen.findByRole("heading", { name: /Find your money style/i })).toBeTruthy();
    await press(user, /^Continue$/);
    await press(user, /Close result/i);
    snap(container, "04a-verify-identity");
  });

  /**
   * Retargeted twice as the prototype grew real: first from "Add recipient",
   * then from the Pay screen's QR card, both of which now lead somewhere.
   * "Share receipt" is the durable target — handing a receipt to another app
   * needs a Share port this codebase has no web global to reach for.
   */
  it("opens and dismisses the simulated action sheet", async () => {
    const user = userEvent.setup();
    seedSignedIn();
    render(
      <BankingGatewayProvider gateway={createMockNetBankGateway()}>
        <App />
      </BankingGatewayProvider>,
    );
    await click(/^Send$/);
    // Step 1 "Send to": the default recipient is already selected.
    await click(/^Continue$/);
    await user.type(screen.getByRole("textbox", { name: /Amount to send/i }), "500");
    await click(/Continue and review/i);
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
    seedSignedIn();
    render(
      <BankingGatewayProvider gateway={createMockNetBankGateway()}>
        <App />
      </BankingGatewayProvider>,
    );

    await user.click(screen.getByRole("button", { name: /^Send$/ }));
    // Step 1 "Send to": the default recipient is already selected.
    await user.click(screen.getByRole("button", { name: /^Continue$/ }));
    await user.type(screen.getByRole("textbox", { name: /Amount to send/i }), "500");
    await user.click(screen.getByRole("button", { name: /Continue and review/i }));

    expect(screen.getByText("Review transfer")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Confirm and send/i }));

    expect(await screen.findByRole("heading", { name: /Transfer complete/i })).toBeTruthy();
    expect(screen.getByText(/NBK-TRF-000001/i)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /View activity/i }));
    expect(await screen.findByRole("heading", { name: "Sent to Jomar D." })).toBeTruthy();
  });
});
