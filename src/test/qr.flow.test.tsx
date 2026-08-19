import { describe, expect, it } from "vitest";
import { press, renderApp as start, type TestUser } from "@/test/helpers/renderApp";
import { screen, within } from "@testing-library/react";
import { QR_MATRIX_SIZE, qrMatrix } from "@/core/domain/qrMatrix";

/**
 * QR PH, both directions. Paying replaces a simulated action sheet; receiving is
 * new outright — the app previously had no way to ask anyone for money.
 */

const openScan = async (user: TestUser) => {
  // Scan is a Home quick action now; the Pay tab it replaced offered the same
  // four actions Home already had, and Activity has the tab slot.
  await press(user, /^Scan$/);
  await press(user, /Scan to pay/i);
};

describe("QR PH flow", () => {
  it("pays a fixed-amount merchant code", async () => {
    const user = start();
    await openScan(user);

    await press(user, /Daily Brew/i);
    const decoded = await screen.findByRole("region", { name: /Decoded code/i });
    expect(within(decoded).getByText("₱185.00")).toBeTruthy();

    // A fixed-amount code locks the amount, so there is nothing to type.
    expect(screen.queryByRole("textbox", { name: /Amount to pay/i })).toBeNull();

    await press(user, /^Continue$/);
    expect(await screen.findByText("Review payment")).toBeTruthy();

    // ₱185 is well under the step-up threshold for a merchant payment.
    await press(user, /Confirm and pay/i);
    expect(await screen.findByRole("heading", { name: /Payment complete/i })).toBeTruthy();
    expect(screen.getByText(/NBK-QRP-000001/)).toBeTruthy();
  });

  it("asks for an amount on an open code", async () => {
    const user = start();
    await openScan(user);

    await press(user, /Sari Maria/i);
    expect(await screen.findByRole("region", { name: /Decoded code/i })).toBeTruthy();

    const amountField = screen.getByRole("textbox", { name: /Amount to pay/i });
    expect(screen.getByRole("button", { name: /^Continue$/ })).toBeDisabled();

    await user.type(amountField, "250");
    await press(user, /^Continue$/);

    expect(await screen.findByText("Review payment")).toBeTruthy();
    const summary = screen.getByRole("region", { name: /Payment summary/i });
    expect(within(summary).getByText("₱250.00")).toBeTruthy();
  });

  it("accepts a pasted payload and rejects anything else", async () => {
    const user = start();
    await openScan(user);

    await user.type(screen.getByRole("textbox", { name: /QR PH code/i }), "not a real code");
    await press(user, /Read this code/i);
    expect(await screen.findByRole("alert")).toHaveTextContent(/not a QR PH code/i);

    await user.clear(screen.getByRole("textbox", { name: /QR PH code/i }));
    await user.type(screen.getByRole("textbox", { name: /QR PH code/i }), "DB-2026-0814");
    await press(user, /Read this code/i);
    expect(await screen.findByRole("region", { name: /Decoded code/i })).toBeTruthy();
  });

  it("steps up on a large merchant payment", async () => {
    const user = start();
    await openScan(user);

    await press(user, /Sari Maria/i);
    expect(await screen.findByRole("region", { name: /Decoded code/i })).toBeTruthy();
    await user.type(screen.getByRole("textbox", { name: /Amount to pay/i }), "12000");
    await press(user, /^Continue$/);

    // Over ₱10,000 a merchant payment asks for the PIN, unlike the ₱185 coffee.
    expect(await screen.findByRole("button", { name: /Continue to confirm/i })).toBeTruthy();
  });

  it("builds a reusable QR code to receive money", async () => {
    const user = start();
    await openScan(user);
    await press(user, /Show my QR code instead/i);

    expect(await screen.findByRole("heading", { name: /Show QR to receive/i })).toBeTruthy();
    const code = screen.getByRole("region", { name: /Your QR PH code/i });
    expect(within(code).getByText("Any amount")).toBeTruthy();
    expect(within(code).getByText(/Reusable · no expiry/i)).toBeTruthy();
    expect(within(code).getByRole("img", { name: /QR code for MAYA SANTOS/i })).toBeTruthy();
  });

  it("says the rendered pattern is not a scannable code", async () => {
    const user = start();
    await openScan(user);
    await press(user, /Show my QR code instead/i);

    // Honesty check: the app must not imply this grid can be scanned.
    expect(await screen.findByText(/Sandbox pattern/i)).toBeTruthy();
  });
});

describe("QR module grid", () => {
  it("is stable for a payload and different across payloads", () => {
    expect(qrMatrix("abc")).toEqual(qrMatrix("abc"));
    expect(qrMatrix("abc")).not.toEqual(qrMatrix("abd"));
  });

  it("keeps the three finder patterns and their separators", () => {
    const matrix = qrMatrix("00020101021128");
    const last = QR_MATRIX_SIZE - 1;

    /** Ring filled, gap clear, 3x3 core filled — read at a corner's origin. */
    const readsAsFinder = (top: number, left: number) =>
      matrix[top][left] &&
      matrix[top][left + 6] &&
      matrix[top + 6][left] &&
      !matrix[top + 1][left + 1] &&
      !matrix[top + 1][left + 5] &&
      matrix[top + 3][left + 3];

    expect(readsAsFinder(0, 0)).toBe(true);
    expect(readsAsFinder(0, QR_MATRIX_SIZE - 7)).toBe(true);
    expect(readsAsFinder(QR_MATRIX_SIZE - 7, 0)).toBe(true);

    // Separator ring stays light so the finders read as finders.
    expect(matrix[7][0]).toBe(false);
    expect(matrix[0][7]).toBe(false);
    // The fourth corner carries data, not a finder — as in a real code.
    expect(readsAsFinder(QR_MATRIX_SIZE - 7, QR_MATRIX_SIZE - 7)).toBe(false);
    expect(matrix[last][last]).toBe(true);
  });
});
