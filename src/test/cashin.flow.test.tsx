import { describe, expect, it } from "vitest";
import { press, renderApp as start, type TestUser } from "@/test/helpers/renderApp";
import { noopPlatform } from "@/core/platform/noopPlatform";
import type { Platform } from "@/core/platform/ports";
import { screen, within } from "@testing-library/react";

/**
 * Cash-in, which never reached the gateway: "Add money" opened a simulated
 * sheet, so `TransactionKind: "cash-in"` was declared and never produced by
 * anything. These cover both directions money can enter — a partner cash-in that
 * settles through the pipeline, and the virtual account other banks push to.
 */

const openDeposit = async (user: TestUser) => {
  await press(user, /Add money/i);
};

describe("cash-in flow", () => {
  it("adds money over the counter, with the partner's fee", async () => {
    const user = start();
    await openDeposit(user);

    // Step 1: choose a method, then continue to the Amount step.
    await press(user, /Over the counter/i);
    await press(user, /^Continue$/);

    await user.type(screen.getByRole("textbox", { name: /Amount to add/i }), "1000");

    // The strip stops claiming "No fee" once a method that charges is chosen.
    expect(screen.getByText("₱20.00")).toBeTruthy();
    expect(screen.getByText(/Credited within an hour/i)).toBeTruthy();

    await press(user, /^Add money$/);

    expect(await screen.findByText("Review cash in")).toBeTruthy();
    const summary = screen.getByRole("region", { name: /Payment summary/i });
    expect(within(summary).getByText("₱1,020.00")).toBeTruthy();

    // Adding money needs no confirmation factor — there is nothing to protect.
    await press(user, /Confirm and add/i);

    expect(await screen.findByRole("heading", { name: /Money added/i })).toBeTruthy();
    expect(screen.getByText(/NBK-CSH-000001/)).toBeTruthy();
  });

  it("credits the balance and files a cash-in transaction", async () => {
    const user = start();
    await openDeposit(user);
    await press(user, /Scan to cash in/i);
    await press(user, /^Continue$/);
    await user.type(screen.getByRole("textbox", { name: /Amount to add/i }), "1000");
    await press(user, /^Add money$/);
    await press(user, /Confirm and add/i);
    expect(await screen.findByRole("heading", { name: /Money added/i })).toBeTruthy();

    await press(user, /View activity/i);
    expect(await screen.findByRole("heading", { name: /Added via Scan to cash in/i })).toBeTruthy();

    // Back to the receipt, then out to Home: ₱24,680.50 + ₱1,000, no fee here.
    await press(user, /Back to home/i);
    await press(user, /^Done$/);
    expect(await screen.findByText("₱25,680.50")).toBeTruthy();
  });

  it("accepts a deposit larger than the current balance", async () => {
    // Add money has no external-source limit to check the amount against —
    // unlike Send money's own-balance cap, a client-side check here would
    // just be checking the wrong number and blocking ordinary top-ups.
    const user = start();
    await openDeposit(user);
    await press(user, /Scan to cash in/i);
    await press(user, /^Continue$/);
    await user.type(screen.getByRole("textbox", { name: /Amount to add/i }), "30000");

    expect(screen.getByRole("button", { name: /^Add money$/ })).toBeEnabled();
    expect(screen.queryByRole("alert")).toBeNull();

    await press(user, /^Add money$/);
    await press(user, /Confirm and add/i);
    expect(await screen.findByRole("heading", { name: /Money added/i })).toBeTruthy();

    await press(user, /^Done$/);
    // ₱24,680.50 + ₱30,000.00, no fee here.
    expect(await screen.findByText("₱54,680.50")).toBeTruthy();
  });

  it("sends a linked-bank cash-in to the virtual account instead of a payment", async () => {
    const user = start();
    await openDeposit(user);

    // "Linked bank account" is the default and is a push method: a wallet cannot
    // pull from another bank, so Step 1's button already reads "Get account
    // number" and skips the Amount step entirely.
    await press(user, /Get account number/i);

    expect(await screen.findByRole("heading", { name: /Your account number/i })).toBeTruthy();
    expect(screen.getByText("0091 2345 6789")).toBeTruthy();

    const details = screen.getByRole("region", { name: /Account details/i });
    expect(within(details).getByText("MAYA SANTOS")).toBeTruthy();
    expect(within(details).getByText(/InstaPay or PESONet/i)).toBeTruthy();
  });

  it("copies the account number through the clipboard port", async () => {
    const copied: string[] = [];
    const platform: Platform = {
      ...noopPlatform,
      clipboard: {
        setString: async (value: string) => {
          copied.push(value);
          return true;
        },
      },
    };

    const user = start({}, platform);
    await openDeposit(user);
    await press(user, /Get account number/i);
    expect(await screen.findByRole("heading", { name: /Your account number/i })).toBeTruthy();

    await press(user, /Copy account number/i);
    expect(copied).toEqual(["009123456789"]);
    expect(await screen.findByRole("button", { name: /Copied/i })).toBeTruthy();
  });

  it("says so when the clipboard refuses", async () => {
    // noopPlatform's clipboard reports failure, which is what a page served over
    // plain HTTP actually does.
    const user = start();
    await openDeposit(user);
    await press(user, /Get account number/i);
    expect(await screen.findByRole("heading", { name: /Your account number/i })).toBeTruthy();

    await press(user, /Copy account number/i);
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not copy/i);
  });

  it("keeps the cash-in draft when going back from review", async () => {
    const user = start();
    await openDeposit(user);
    await press(user, /Over the counter/i);
    await press(user, /^Continue$/);
    await user.type(screen.getByRole("textbox", { name: /Amount to add/i }), "750");
    await press(user, /^Add money$/);
    expect(await screen.findByText("Review cash in")).toBeTruthy();

    // Back to the Amount step: the typed amount survived in the store.
    await press(user, /Back to home/i);
    expect(screen.getByRole("textbox", { name: /Amount to add/i })).toHaveValue("750");

    // Back again: step-aware back returns to "Choose a method" without leaving
    // the screen, and the method chosen there survived too.
    await press(user, /Back to home/i);
    expect(screen.getByRole("button", { name: /Over the counter/i })).toHaveAttribute("aria-pressed", "true");
  });
});
