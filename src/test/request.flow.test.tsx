import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { createMockNetBankGateway } from "@/platform/web/createMockNetBankGateway";
import App from "../App";

/**
 * Request money (GAP-03): pick a saved recipient, an amount and a note, then
 * file a *pending* request. The request itself moves nothing — the balance
 * changes only when the recipient accepts and the payment runs through the
 * shared review → confirm → receipt pipeline. The recipient's reply is
 * simulated on this device (dev-only accept/reject actions on the request
 * rows in Activity), which is how both parties end up seeing the right state.
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

const openHome = async (user: ReturnType<typeof userEvent.setup>) => {
  await press(user, /Start my journey/i);
  await press(user, /^Continue$/);
  await press(user, /Build my plan/i);
};

const openRequestEntry = async (user: ReturnType<typeof userEvent.setup>) => {
  await openHome(user);
  await press(user, /^Request$/);
};

/** Files a ₱500 request from the preselected first recipient, landing on Activity. */
const fileRequest = async (user: ReturnType<typeof userEvent.setup>, amount = "500", note = "Lunch money") => {
  await openRequestEntry(user);
  await user.type(screen.getByRole("textbox", { name: /Amount to request/i }), amount);
  await user.type(screen.getByPlaceholderText("What is this for?"), note);
  await press(user, /^Send request$/);
};

describe("request money flow", () => {
  it("shows the request pending and moves the balance only on acceptance", async () => {
    const user = start();
    await fileRequest(user);

    // The requester sees the pending state in Activity, with the note and amount.
    const section = screen.getByRole("region", { name: /Money requests/i });
    expect(within(section).getByText("Jomar D.")).toBeTruthy();
    expect(within(section).getByText("Lunch money · Just now")).toBeTruthy();
    expect(within(section).getByText("₱500.00")).toBeTruthy();
    expect(within(section).getByText("Pending")).toBeTruthy();

    // Creating the request moved nothing.
    await press(user, /Back to home/i);
    await press(user, /Back to home/i);
    expect(await screen.findByText("₱24,680.50")).toBeTruthy();

    // The recipient accepts (simulated): the payment runs through the pipeline.
    await press(user, /^View all$/);
    await press(user, /^Accept$/);
    expect(await screen.findByText("Review request")).toBeTruthy();
    expect(screen.getByText("You’re receiving")).toBeTruthy();
    expect(screen.getByText("from Jomar D.")).toBeTruthy();

    await press(user, /Confirm and receive/i);
    expect(await screen.findByRole("heading", { name: /Money received/i })).toBeTruthy();
    expect(screen.getByText("Received from Jomar D.")).toBeTruthy();
    expect(screen.getByText(/NBK-RQS-000001/)).toBeTruthy();

    // Balance credited: ₱24,680.50 + ₱500.00 = ₱25,180.50.
    await press(user, /^Done$/);
    expect(await screen.findByText("₱25,180.50")).toBeTruthy();

    // Both parties see the right state: the request is accepted and the
    // payment is filed as activity.
    await press(user, /^View all$/);
    expect(await screen.findByRole("region", { name: /Money requests/i })).toBeTruthy();
    expect(within(screen.getByRole("region", { name: /Money requests/i })).getByText("Accepted")).toBeTruthy();
    expect(screen.getByText("Received from Jomar D.")).toBeTruthy();
  });

  it("rejects a request without moving any money", async () => {
    const user = start();
    await fileRequest(user, "250", "For the snacks");

    expect(within(screen.getByRole("region", { name: /Money requests/i })).getByText("Pending")).toBeTruthy();
    await press(user, /^Reject$/);
    expect(within(screen.getByRole("region", { name: /Money requests/i })).getByText("Rejected")).toBeTruthy();

    await press(user, /Back to home/i);
    await press(user, /Back to home/i);
    expect(await screen.findByText("₱24,680.50")).toBeTruthy();
  });

  it("leaves a request pending and the balance untouched when review is abandoned", async () => {
    const user = start();
    await fileRequest(user, "500", "Lunch money");

    // Start the simulated acceptance, then walk away before confirming.
    await press(user, /^Accept$/);
    expect(await screen.findByText("Review request")).toBeTruthy();
    await press(user, /Back to home/i);

    // Still pending: the payment never submitted, so acceptance never fired.
    const section = screen.getByRole("region", { name: /Money requests/i });
    expect(within(section).getByText("Pending")).toBeTruthy();
    expect(within(section).queryByText("Accepted")).toBeNull();

    // Balance unchanged: ₱24,680.50, not ₱25,180.50.
    await press(user, /Back to home/i);
    await press(user, /Back to home/i);
    expect(await screen.findByText("₱24,680.50")).toBeTruthy();
  });

  it("blocks an empty or zero amount inline", async () => {
    const user = start();
    await openRequestEntry(user);

    expect(screen.getByRole("button", { name: /^Send request$/ })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: /Amount to request/i }), "0");
    expect(await screen.findByRole("alert")).toHaveTextContent(/Enter the amount you want to request/i);
    expect(screen.getByRole("button", { name: /^Send request$/ })).toBeDisabled();

    await user.clear(screen.getByRole("textbox", { name: /Amount to request/i }));
    await user.type(screen.getByRole("textbox", { name: /Amount to request/i }), "300");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: /^Send request$/ })).toBeEnabled();
  });

  it("requests from a chosen saved recipient and keeps the note on the request", async () => {
    const user = start();
    await openRequestEntry(user);

    // Mira S. instead of the preselected Jomar D. (initials span is aria-hidden,
    // so the button's accessible name is "Mira S. 0917 ••• 2288").
    await press(user, /^Mira S\./);
    await user.type(screen.getByRole("textbox", { name: /Amount to request/i }), "1250");
    await user.type(screen.getByPlaceholderText("What is this for?"), "Electric bill share");
    await press(user, /^Send request$/);

    const section = screen.getByRole("region", { name: /Money requests/i });
    expect(within(section).getByText("Mira S.")).toBeTruthy();
    expect(within(section).getByText("Electric bill share · Just now")).toBeTruthy();
    expect(within(section).getByText("₱1,250.00")).toBeTruthy();
    expect(within(section).getByText("Pending")).toBeTruthy();
  });
});
