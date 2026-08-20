import { describe, expect, it } from "vitest";
import { press, renderApp as start, type TestUser } from "@/test/helpers/renderApp";
import { screen, within } from "@testing-library/react";

/**
 * GAP-07 — the savings jar. The "Open a savings jar card" option used to end in
 * a simulated toast; now it opens a real jar: a separate balance with its own
 * card face, excluded from the main balance and the spending limit, with money
 * moving in and out through the shared review/confirm/receipt pipeline.
 */

const openWalletTab = async (user: TestUser) => {
  const nav = screen.getByRole("navigation", { name: /primary navigation/i });
  await user.click(within(nav).getByRole("button", { name: /^Wallet$/ }));
};

const openJar = async (user: TestUser) => {
  await openWalletTab(user);
  await press(user, /Add card/);
  await press(user, /Savings jar/);
  // Opening is a gateway round-trip; wait for the wallet tab to show the jar.
  await screen.findByRole("region", { name: /Savings jar/ });
};

const jarFace = () => screen.getByRole("region", { name: /Savings jar/ });

describe("savings jar flow", () => {
  it("opens the jar instead of a toast, with its own zero balance", async () => {
    const user = start();
    await openJar(user);

    // Back on the Wallet tab, the jar has its own card face.
    const face = jarFace();
    expect(within(face).getByText("Savings jar")).toBeTruthy();
    expect(within(face).getByText("₱0.00")).toBeTruthy();

    // The main balance and the spending limit are untouched by the jar existing.
    await press(user, /^Home$/);
    expect(await screen.findByText("₱24,680.50")).toBeTruthy();
    expect(screen.getByText("₱1,240 of ₱3,000")).toBeTruthy();
  });

  it("moves money into the jar through the shared pipeline and excludes it from the main balance", async () => {
    const user = start();
    await openJar(user);

    await user.click(within(jarFace()).getByRole("button", { name: /Add money/ }));
    await user.type(screen.getByRole("textbox", { name: /Amount to move/i }), "1000");
    await press(user, /^Move into jar$/);

    // Review names both sides of the move, free and instant.
    expect(screen.getByText("Review jar deposit")).toBeTruthy();
    const summary = screen.getByRole("region", { name: /Payment summary/i });
    expect(within(summary).getByText("Main wallet •••• 8421")).toBeTruthy();
    expect(within(summary).getByText("Savings jar")).toBeTruthy();
    expect(within(summary).getByText("₱1,000.00")).toBeTruthy();

    // Moving into the jar never steps up — it is an internal ledger move.
    await press(user, /Confirm and move/);
    expect(await screen.findByRole("heading", { name: /Jar topped up/i })).toBeTruthy();
    expect(screen.getByText(/NBK-JIN-000001/)).toBeTruthy();

    await press(user, /^Done$/);

    // Home shows only the main balance: ₱24,680.50 − ₱1,000, no ₱1,000.00 added.
    expect(await screen.findByText("₱23,680.50")).toBeTruthy();
    expect(screen.queryByText("₱25,680.50")).toBeNull();

    // The jar balance is its own figure on the Wallet tab.
    await openWalletTab(user);
    expect(within(jarFace()).getByText("₱1,000.00")).toBeTruthy();
  });

  it("moves money out of the jar and settles both balances", async () => {
    const user = start();
    await openJar(user);

    await user.click(within(jarFace()).getByRole("button", { name: /Add money/ }));
    await user.type(screen.getByRole("textbox", { name: /Amount to move/i }), "1000");
    await press(user, /^Move into jar$/);
    await press(user, /Confirm and move/);
    expect(await screen.findByRole("heading", { name: /Jar topped up/i })).toBeTruthy();
    await press(user, /^Done$/);

    await openWalletTab(user);
    await user.click(within(jarFace()).getByRole("button", { name: /Withdraw/ }));
    await user.type(screen.getByRole("textbox", { name: /Amount to move/i }), "400");
    await press(user, /^Move out of jar$/);

    // Withdrawals read from the jar, not from a card.
    expect(screen.getByText("Review jar withdrawal")).toBeTruthy();
    const summary = screen.getByRole("region", { name: /Payment summary/i });
    expect(within(summary).getByText("Savings jar")).toBeTruthy();
    expect(within(summary).getByText("Main wallet •••• 8421")).toBeTruthy();

    await press(user, /Confirm and withdraw/);
    expect(await screen.findByRole("heading", { name: /Withdrawn from jar/i })).toBeTruthy();
    expect(screen.getByText(/NBK-JOT-000001/)).toBeTruthy();

    // The receipt reads from the jar, not from the card the money lands on.
    const details = screen.getByRole("region", { name: /Receipt details/i });
    expect(within(details).getByText("Savings jar")).toBeTruthy();
    expect(within(details).queryByText("Main wallet •••• 8421")).toBeNull();

    await press(user, /^Done$/);

    // ₱1,000 in, ₱400 out: jar holds ₱600 and the main balance is back up.
    expect(await screen.findByText("₱24,080.50")).toBeTruthy();
    await openWalletTab(user);
    expect(within(jarFace()).getByText("₱600.00")).toBeTruthy();
  });

  it("blocks a withdrawal the jar cannot cover, through the review error surface", async () => {
    const user = start();
    await openJar(user);

    await user.click(within(jarFace()).getByRole("button", { name: /Add money/ }));
    await user.type(screen.getByRole("textbox", { name: /Amount to move/i }), "500");
    await press(user, /^Move into jar$/);
    await press(user, /Confirm and move/);
    expect(await screen.findByRole("heading", { name: /Jar topped up/i })).toBeTruthy();
    await press(user, /^Done$/);

    await openWalletTab(user);
    await user.click(within(jarFace()).getByRole("button", { name: /Withdraw/ }));
    await user.type(screen.getByRole("textbox", { name: /Amount to move/i }), "2000");
    await press(user, /^Move out of jar$/);

    // The gateway refuses at quote time; the review screen shows why.
    expect(await screen.findByRole("alert")).toHaveTextContent(/more than your jar holds/i);
    expect(screen.getByRole("button", { name: /Confirm and withdraw/ })).toBeDisabled();
  });

  it("blocks a deposit the wallet card cannot cover", async () => {
    const user = start();
    await openJar(user);

    await user.click(within(jarFace()).getByRole("button", { name: /Add money/ }));
    await user.type(screen.getByRole("textbox", { name: /Amount to move/i }), "99999");
    await press(user, /^Move into jar$/);

    // Same error surface as any other payment: quote refuses, nothing moves.
    expect(await screen.findByRole("alert")).toHaveTextContent(/more than this wallet holds/i);
    expect(screen.getByRole("button", { name: /Confirm and move/ })).toBeDisabled();
  });
});
