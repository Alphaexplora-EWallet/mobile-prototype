import { describe, expect, it } from "vitest";
import { press, renderApp as start, type TestUser } from "@/test/helpers/renderApp";
import { screen, within } from "@testing-library/react";

/**
 * Bills and autopay. The four biller rows and two scheduled rows on bill-entry
 * all opened the same simulated sheet; now they validate an account with the
 * biller, pay through the pipeline, and let a schedule be paused or cancelled.
 */

const openBillers = async (user: TestUser) => {
  // Scan is a Home quick action now; the Pay tab it replaced offered the same
  // four actions Home already had, and Activity has the tab slot.
  await press(user, /^Scan$/);
  await press(user, /Payment options/i);
  await press(user, /Pay a bill/i);
};

describe("bill payment flow", () => {
  it("validates the account and prefills what is due", async () => {
    const user = start();
    await openBillers(user);
    // Scoped by the detail line: "Meralco" is also a scheduled-payment row.
    await press(user, /MeralcoElectricity/i);

    expect(await screen.findByRole("heading", { name: "Meralco" })).toBeTruthy();

    // Nothing to pay until the biller confirms the account exists.
    expect(screen.queryByRole("textbox", { name: /Amount to pay/i })).toBeNull();

    await user.type(screen.getByRole("textbox", { name: /Biller account number/i }), "0412887301");
    await press(user, /Check this account/i);

    const confirmed = await screen.findByRole("status");
    expect(confirmed).toHaveTextContent(/due/i);
    // The amount the biller reported is prefilled rather than typed.
    expect(screen.getByRole("textbox", { name: /Amount to pay/i })).not.toHaveValue("");
  });

  it("pays a bill through the pipeline", async () => {
    const user = start();
    await openBillers(user);
    await press(user, /ConvergeHome internet/i);

    await user.type(screen.getByRole("textbox", { name: /Biller account number/i }), "8830012245");
    await press(user, /Check this account/i);
    expect(await screen.findByRole("status")).toBeTruthy();

    await user.clear(screen.getByRole("textbox", { name: /Amount to pay/i }));
    await user.type(screen.getByRole("textbox", { name: /Amount to pay/i }), "1699");
    await press(user, /^Continue$/);

    expect(await screen.findByText("Review payment")).toBeTruthy();
    // The biller account is the counterparty detail in the hero, under the name.
    expect(screen.getByText(/Account 8830012245/)).toBeTruthy();
    const summary = screen.getByRole("region", { name: /Payment summary/i });
    expect(within(summary).getByText("₱1,699.00")).toBeTruthy();

    await press(user, /Confirm and pay/i);
    expect(await screen.findByRole("heading", { name: /Bill paid/i })).toBeTruthy();
    expect(screen.getByText(/NBK-BIL-000001/)).toBeTruthy();
  });

  it("rejects a too-short biller account number", async () => {
    const user = start();
    await openBillers(user);
    await press(user, /LandlordMonthly rent/i);

    await user.type(screen.getByRole("textbox", { name: /Biller account number/i }), "123");
    await press(user, /Check this account/i);

    expect(await screen.findByRole("alert")).toHaveTextContent(/at least 6 digits/i);
  });
});

describe("autopay management", () => {
  it("pauses a schedule and bill-entry remembers", async () => {
    const user = start();
    await openBillers(user);

    await press(user, /Meralco.*Autopay · Aug 18/i);
    expect(await screen.findByRole("heading", { name: "Meralco" })).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();

    await press(user, /Pause autopay/i);
    expect(await screen.findByText("Paused")).toBeTruthy();
    expect(screen.getByText(/will not run/i)).toBeTruthy();

    // Back on bill-entry the row says so, and it survives leaving the screen.
    await press(user, /Back to home/i);
    expect(await screen.findByText(/Paused · Aug 18/i)).toBeTruthy();
  });

  it("resumes a paused schedule", async () => {
    const user = start();
    await openBillers(user);
    await press(user, /Converge.*Autopay · Aug 22/i);

    await press(user, /Pause autopay/i);
    expect(await screen.findByText("Paused")).toBeTruthy();

    await press(user, /Resume autopay/i);
    expect(await screen.findByText("Active")).toBeTruthy();
  });

  it("cancels a schedule and removes it from the list", async () => {
    const user = start();
    await openBillers(user);
    const scheduledConverge = /Converge.*Autopay · Aug 22/i;
    expect(screen.getByRole("button", { name: scheduledConverge })).toBeTruthy();

    await press(user, scheduledConverge);
    await press(user, /Cancel this autopay/i);

    // Back on Pay: the schedule is gone, though the biller row remains.
    expect(await screen.findByRole("button", { name: /Meralco.*Autopay · Aug 18/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: scheduledConverge })).toBeNull();
    expect(screen.getByRole("button", { name: /ConvergeHome internet/i })).toBeTruthy();
  });
});
