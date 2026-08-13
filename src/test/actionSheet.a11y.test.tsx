import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { createMockNetBankGateway } from "@/platform/web/createMockNetBankGateway";
import App from "../App";

/**
 * The simulated action sheet is the app's only modal dialog, and it is also
 * where the new Stage 1–2 flows land ("Share receipt" after cash-out, load,
 * request, jar moves). A dialog that does not take focus, trap Tab, dismiss on
 * Escape, or return focus is unusable with a keyboard — so its focus behaviour
 * is tested as behaviour, not assumed.
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

const click = async (user: ReturnType<typeof userEvent.setup>, name: RegExp | string) =>
  user.click(screen.getByRole("button", { name }));

/** Onboards and pays a transfer so the receipt screen with "Share receipt" is visible. */
const openReceipt = async (user: ReturnType<typeof userEvent.setup>) => {
  await click(user, /Start my journey/i);
  await click(user, /^Continue$/);
  await click(user, /Build my plan/i);

  await click(user, /^Send$/);
  // Step 1 "Send to": the default recipient is already selected.
  await click(user, /^Continue$/);
  await user.type(screen.getByRole("textbox", { name: /Amount to send/i }), "500");
  await click(user, /Continue and review/i);
  await click(user, /Confirm and send/i);
  expect(await screen.findByRole("heading", { name: /Transfer complete/i })).toBeTruthy();
};

describe("action sheet focus management", () => {
  it("moves focus in, traps Tab, closes on Escape, and restores focus", async () => {
    const user = start();
    await openReceipt(user);

    const shareButton = screen.getByRole("button", { name: /Share receipt/i });
    await user.click(shareButton);

    const sheet = screen.getByRole("dialog", { name: /Share receipt/i });
    expect(within(sheet).getByText(/safely simulated/i)).toBeTruthy();

    // Focus lands inside the dialog on open.
    expect(screen.getByRole("button", { name: /Got it/i })).toHaveFocus();

    // The only control in the sheet: Tab wraps back to it instead of escaping
    // to the background screen.
    await user.tab();
    expect(screen.getByRole("button", { name: /Got it/i })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: /Got it/i })).toHaveFocus();

    // Escape dismisses the dialog without clicking anything.
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();

    // Focus returns to the control that opened the sheet.
    expect(shareButton).toHaveFocus();
  });
});
