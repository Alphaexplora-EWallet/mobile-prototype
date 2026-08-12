import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { PlatformProvider } from "@/core/platform/PlatformContext";
import { noopPlatform } from "@/core/platform/noopPlatform";
import { createMockNetBankGateway } from "@/platform/web/createMockNetBankGateway";
import { createWebPlatform } from "@/platform/web/createWebPlatform";
import App from "../App";

/**
 * Real statement export (GAP-05): the month list opens a real month view with
 * opening/closing balances and dated entries, the Export button hands a CSV
 * artifact to the browser through the platform port, and an empty month shows
 * the empty-file state instead of crashing or shipping a header-only file.
 */

const press = async (user: ReturnType<typeof userEvent.setup>, name: RegExp | string) =>
  user.click(screen.getByRole("button", { name }));

const openHome = async (user: ReturnType<typeof userEvent.setup>) => {
  await press(user, /Start my journey/i);
  await press(user, /^Continue$/);
  await press(user, /Build my plan/i);
};

const openStatements = async (user: ReturnType<typeof userEvent.setup>) => {
  await openHome(user);
  const nav = screen.getByRole("navigation", { name: /primary navigation/i });
  await user.click(within(nav).getByRole("button", { name: /^Profile$/ }));
  await press(user, /^Statements/);
};

const start = (platform = noopPlatform, options: { kycTier?: "full" } = {}) => {
  const user = userEvent.setup();
  render(
    <BankingGatewayProvider gateway={createMockNetBankGateway(options)}>
      <PlatformProvider platform={platform}>
        <App />
      </PlatformProvider>
    </BankingGatewayProvider>,
  );
  return user;
};

/** jsdom has no object URLs; give the web adapter a place to hand the blob. */
const stubObjectUrls = () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:mock");
  const revokeObjectURL = vi.fn<(url: string) => void>();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
  return { createObjectURL, revokeObjectURL };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("statement month view", () => {
  it("renders a real month: balances, count, and dated entries", async () => {
    const user = start(undefined, { kycTier: "full" });
    await openStatements(user);

    // The list shows every generated month with its closing balance.
    expect(screen.getByRole("button", { name: /July 2026/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /April 2026/i })).toBeTruthy();

    await press(user, /July 2026/i);

    // Summary card: opening → closing, plus the transaction count.
    const summary = await screen.findByRole("region", { name: /Statement summary/i });
    expect(within(summary).getByText("Opening")).toBeTruthy();
    expect(within(summary).getByText("₱21,940.25")).toBeTruthy();
    expect(within(summary).getByText("₱24,680.50")).toBeTruthy();
    expect(within(summary).getByText("12 transactions")).toBeTruthy();

    // Dated entries with signed amounts and running balances.
    const entries = screen.getByRole("region", { name: /July 2026 transactions/i });
    expect(within(entries).getByText("Funds received — salary")).toBeTruthy();
    expect(within(entries).getByText("Jul 2, 2026 · NBK-2026-0701")).toBeTruthy();
    expect(within(entries).getByText("−₱5,000.00")).toBeTruthy();
    expect(within(entries).getByText("₱22,680.50")).toBeTruthy();
    expect(within(entries).getByText("+₱2,000.00")).toBeTruthy();

    expect(screen.getByRole("button", { name: /Export as CSV/i })).toBeTruthy();
  });

  it("exports a CSV artifact through the platform port", async () => {
    const { createObjectURL } = stubObjectUrls();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = start(createWebPlatform(), { kycTier: "full" });
    await openStatements(user);
    await press(user, /July 2026/i);

    await press(user, /Export as CSV/i);

    // The port handed a real blob of CSV bytes to the browser and the anchor
    // download was triggered with the period-derived filename.
    expect(await screen.findByText(/Saved as fina-statement-2026-07\.csv/i)).toBeTruthy();
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const csv = await blob.text();
    expect(csv).toContain("Date,Description,Reference,Amount (PHP),Balance (PHP)");
    expect(csv).toContain("NBK-2026-0711"); // the PESONet row, quoting intact
    expect(csv).toContain('"Jul 2, 2026",Funds received — salary');
    expect(csv).not.toContain("₱"); // spreadsheets parse numbers, not formatted pesos
  });

  it("shows the empty-file state for a month with no transactions", async () => {
    const { createObjectURL } = stubObjectUrls();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = start(createWebPlatform(), { kycTier: "full" });
    await openStatements(user);
    await press(user, /April 2026/i);

    // The month view itself says nothing moved.
    expect(await screen.findByText(/No transactions in April 2026/i)).toBeTruthy();
    expect(screen.getByText("0 transactions")).toBeTruthy();

    // Export explains itself instead of producing a header-only file.
    await press(user, /Export as CSV/i);
    expect(await screen.findByText(/April 2026 has no transactions, so there is nothing to export/i)).toBeTruthy();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
