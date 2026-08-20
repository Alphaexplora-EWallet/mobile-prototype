import { describe, expect, it } from "vitest";
import { press, renderApp as start, type TestUser } from "@/test/helpers/renderApp";
import { screen } from "@testing-library/react";

/**
 * Send to a mobile number (GAP-04): address a FIN-A wallet by phone, see whose
 * wallet the number belongs to before anything moves, then send through the
 * shared review → confirm → receipt pipeline. The number-to-name lookup is
 * simulated on the mock directory; an unregistered number is blocked with a
 * message, never guessed.
 */

const openSendMobile = async (user: TestUser) => {
  await press(user, /^Send$/);
  await press(user, /Add recipient/i);
  await press(user, /Send to a mobile number/i);
};

/** Fills amount + number on the send-to-mobile screen and runs the name check. */
const fillAndCheck = async (user: TestUser, number: string, amount = "500") => {
  await user.type(screen.getByRole("textbox", { name: /Amount to send/i }), amount);
  await user.type(screen.getByRole("textbox", { name: /Mobile number/i }), number);
  await press(user, /^Check name$/);
};

describe("send to a mobile number flow", () => {
  it("confirms the wallet's name, then sends through the shared pipeline", async () => {
    const user = start();
    await openSendMobile(user);

    // Mira S. is the fixture wallet registered to 0917 456 2288.
    await fillAndCheck(user, "09174562288");
    expect(
      await screen.findByText(
        (content) => content.includes("Sending to MIRA S.") && content.includes("Is that right?"),
      ),
    ).toBeTruthy();

    await user.type(screen.getByPlaceholderText("What is this for?"), "Dinner split");
    await press(user, /^Continue$/);

    // Review shows the confirmed name and the masked number, never the full one.
    expect(await screen.findByText("Review transfer")).toBeTruthy();
    expect(screen.getByText("to MIRA S.")).toBeTruthy();
    expect(screen.getByText("0917 ••• 2288")).toBeTruthy();
    expect(screen.queryByText("09174562288")).toBeNull();

    // Internal FIN-A move: no step-up, straight to the receipt.
    await press(user, /Confirm and send/i);
    expect(await screen.findByRole("heading", { name: /Transfer complete/i })).toBeTruthy();
    expect(screen.getByText(/Sent to MIRA S\./i)).toBeTruthy();

    // ₱24,680.50 − ₱500.00 = ₱24,180.50.
    await press(user, /^Done$/);
    expect(await screen.findByText("₱24,180.50")).toBeTruthy();
  });

  it("blocks an unregistered number with a message, without crashing", async () => {
    const user = start();
    await openSendMobile(user);

    await fillAndCheck(user, "09171234567");
    expect(await screen.findByRole("alert")).toHaveTextContent(/No FIN-A wallet is registered to that number yet/i);
    expect(screen.getByRole("button", { name: /^Continue$/ })).toBeDisabled();

    // The confirmed name never appears, and the flow is still navigable.
    expect(screen.queryByText(/Is that right\?/)).toBeNull();
    await press(user, /Back to home/i);
    expect(await screen.findByText("Choose a recipient")).toBeTruthy();
  });

  it("keeps the check disabled until the number is a well-formed mobile number", async () => {
    const user = start();
    await openSendMobile(user);

    const check = () => screen.getByRole("button", { name: /^Check name$/ });
    expect(check()).toBeDisabled();

    await user.type(screen.getByRole("textbox", { name: /Mobile number/i }), "12345");
    expect(check()).toBeDisabled();

    await user.clear(screen.getByRole("textbox", { name: /Mobile number/i }));
    await user.type(screen.getByRole("textbox", { name: /Mobile number/i }), "09174562288");
    expect(check()).toBeEnabled();
  });
});
