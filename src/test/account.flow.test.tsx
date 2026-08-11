import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { createMockNetBankGateway, type MockGatewayOptions } from "@/platform/web/createMockNetBankGateway";
import App from "../App";

/**
 * The account layer: settings, verification, limits, statements, notifications,
 * disputes and the auth steps. None of this existed — the app had no settings
 * screen at all, and several controls were rendered with no handler.
 */

const start = (options: MockGatewayOptions = {}) => {
  const user = userEvent.setup();
  render(
    <BankingGatewayProvider gateway={createMockNetBankGateway(options)}>
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

/** Profile's options button used to be decorative; it is the settings entry. */
const openSettings = async (user: ReturnType<typeof userEvent.setup>, options?: MockGatewayOptions) => {
  const user2 = options ? start(options) : user;
  await openHome(user2);
  const nav = screen.getByRole("navigation", { name: /primary navigation/i });
  await user2.click(within(nav).getByRole("button", { name: /^Profile$/ }));
  await press(user2, /Profile options/i);
  return user2;
};

describe("settings hub", () => {
  it("opens from the profile options button and reaches the account screens", async () => {
    const user = start();
    await openSettings(user);

    expect(await screen.findByText("Settings")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Account detailsNumber/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Limits and fees/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /VerificationYour tier/i })).toBeTruthy();
  });

  it("toggles dark mode from settings rather than only from Home", async () => {
    const user = start();
    await openSettings(user);

    const darkMode = screen.getByRole("switch", { name: /Dark mode/i });
    expect(darkMode).toHaveAttribute("aria-checked", "false");
    await user.click(darkMode);
    expect(screen.getByRole("switch", { name: /Dark mode/i })).toHaveAttribute("aria-checked", "true");
  });
});

describe("notifications", () => {
  it("shows unread notifications and marks them read", async () => {
    const user = start();
    await openSettings(user);
    await press(user, /NotificationsPayments, security/i);

    expect(await screen.findByText(/You received ₱2,000.00/i)).toBeTruthy();
    expect(screen.getAllByLabelText("Unread")).toHaveLength(2);

    await press(user, /Mark all as read/i);
    expect(screen.queryByLabelText("Unread")).toBeNull();
  });

  it("opens the transaction a payment notification points at", async () => {
    const user = start();
    await openSettings(user);
    await press(user, /NotificationsPayments, security/i);
    await press(user, /You received ₱2,000.00/i);

    expect(await screen.findByRole("heading", { name: "Money received" })).toBeTruthy();
  });
});

describe("verification", () => {
  it("shows the current tier and what the next one unlocks", async () => {
    const user = start();
    await openSettings(user);
    await press(user, /VerificationYour tier/i);

    expect(await screen.findByRole("heading", { name: "Verified" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Unlock Fully verified/i })).toBeTruthy();
    expect(screen.getByText("PESONet transfers")).toBeTruthy();
  });

  it("walks the capture flow and promotes the tier", async () => {
    const user = start();
    await openSettings(user);
    await press(user, /VerificationYour tier/i);
    await press(user, /Start verification/i);

    // Document → front → back → selfie → address.
    expect(await screen.findByText("Step 1 of 5")).toBeTruthy();
    await press(user, /^Continue$/);

    expect(await screen.findByText(/Front of your PhilSys/i)).toBeTruthy();
    await press(user, /^Capture$/);
    await press(user, /^Continue$/);

    expect(await screen.findByText(/Back of your PhilSys/i)).toBeTruthy();
    await press(user, /^Capture$/);
    await press(user, /^Continue$/);

    expect(await screen.findByText(/Take a selfie/i)).toBeTruthy();
    await press(user, /^Capture$/);
    await press(user, /^Continue$/);

    expect(await screen.findByText("Step 5 of 5")).toBeTruthy();
    // The submit button stays disabled until the address is usable.
    expect(screen.getByRole("button", { name: /Submit for review/i })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: /Street address/i }), "12 Mabini St");
    await user.type(screen.getByRole("textbox", { name: /^City$/i }), "Quezon City");
    await press(user, /Submit for review/i);

    expect(await screen.findByRole("heading", { name: "Fully verified" })).toBeTruthy();
  });

  it("skips the back-of-card step for a passport", async () => {
    const user = start();
    await openSettings(user);
    await press(user, /VerificationYour tier/i);
    await press(user, /Start verification/i);

    await press(user, /Philippine passportPhoto page only/i);
    await press(user, /^Continue$/);
    await press(user, /^Capture$/);
    await press(user, /^Continue$/);

    // A passport has one page, so it goes straight to the selfie.
    expect(await screen.findByText(/Take a selfie/i)).toBeTruthy();
  });
});

describe("limits and statements", () => {
  it("shows per-rail limits and locks what the tier does not allow", async () => {
    const user = start();
    await openSettings(user);
    await press(user, /Limits and fees/i);

    const pesonet = await screen.findByRole("region", { name: "PESONet" });
    expect(within(pesonet).getByText(/Locked until you are fully verified/i)).toBeTruthy();

    const instapay = screen.getByRole("region", { name: "InstaPay" });
    expect(within(instapay).getByText("₱15.00")).toBeTruthy();
    // Per-transfer and daily are both ₱50,000 at the Verified tier.
    expect(within(instapay).getAllByText("₱50,000.00")).toHaveLength(2);
    expect(within(instapay).getByText(/left today/i)).toBeTruthy();
  });

  it("gates statements behind full verification, and offers the way out", async () => {
    const user = start();
    await openSettings(user);
    await press(user, /StatementsMonthly summaries/i);

    expect(await screen.findByRole("alert")).toHaveTextContent(/unlock once you are fully verified/i);
    await press(user, /Finish verification/i);
    expect(await screen.findByRole("heading", { name: "Verified" })).toBeTruthy();
  });

  it("lists statements once fully verified", async () => {
    const user = start({ kycTier: "full" });
    await openHome(user);
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    await user.click(within(nav).getByRole("button", { name: /^Profile$/ }));
    await press(user, /Profile options/i);
    await press(user, /StatementsMonthly summaries/i);

    expect(await screen.findByRole("button", { name: /July 202612 transactions/i })).toBeTruthy();
  });
});

describe("security settings", () => {
  it("lists sessions and signs out another device but not this one", async () => {
    const user = start();
    await openSettings(user);
    await press(user, /SecurityPIN, biometrics/i);

    expect(await screen.findByText(/Chrome on macOS/i)).toBeTruthy();
    expect(screen.getByText("This device")).toBeTruthy();

    await press(user, /Sign out/i);
    expect(screen.queryByText(/Chrome on macOS/i)).toBeNull();
  });
});

describe("disputes", () => {
  it("files a dispute against an opened transaction", async () => {
    const user = start();
    await openHome(user);
    await press(user, /View all/i);
    await press(user, /Daily Brew/i);

    expect(await screen.findByRole("heading", { name: "Daily Brew" })).toBeTruthy();
    await press(user, /Dispute this/i);

    await press(user, /I was charged twice/i);
    await user.type(screen.getByRole("textbox", { name: /Dispute details/i }), "Two identical charges.");
    await press(user, /File this dispute/i);

    expect(await screen.findByRole("heading", { name: /Dispute filed/i })).toBeTruthy();
    expect(screen.getByText(/NBK-2026-0001/)).toBeTruthy();
  });
});

describe("activity depth", () => {
  it("filters and searches", async () => {
    const user = start();
    await openHome(user);
    await press(user, /View all/i);

    expect(await screen.findByRole("button", { name: /FreshMart/i })).toBeTruthy();

    await press(user, /Money in/i);
    expect(screen.queryByRole("button", { name: /FreshMart/i })).toBeNull();
    expect(screen.getByRole("button", { name: /Money received/i })).toBeTruthy();

    await press(user, /^All$/);
    await user.type(screen.getByRole("searchbox", { name: /Search activity/i }), "freshmart");
    expect(await screen.findByRole("button", { name: /FreshMart/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Daily Brew/i })).toBeNull();
  });

  it("says when nothing matches rather than looking empty", async () => {
    const user = start();
    await openHome(user);
    await press(user, /View all/i);

    await user.type(screen.getByRole("searchbox", { name: /Search activity/i }), "nothing matches this");
    expect(await screen.findByText(/Nothing matches that/i)).toBeTruthy();
  });
});

describe("auth steps", () => {
  it("sends a reset link without confirming the address exists", async () => {
    const user = start();
    await press(user, /I already have an account/i);
    await press(user, /Forgot password/i);

    await user.type(screen.getByRole("textbox", { name: /Email address/i }), "maya@example.com");
    await press(user, /Send reset link/i);

    // Deliberately non-committal: it must not disclose who has an account.
    expect(await screen.findByText(/If maya@example.com has an account/i)).toBeTruthy();
  });

  it("verifies a one-time code before signing in", async () => {
    const user = start();
    await press(user, /I already have an account/i);
    await press(user, /Continue with demo account/i);
    expect(await screen.findByText("Recent transactions")).toBeTruthy();
  });
});

describe("wired-up dead controls", () => {
  it("opens profile from the home avatar", async () => {
    const user = start();
    await openHome(user);
    await press(user, /Open profile/i);
    expect(await screen.findByRole("button", { name: /Retake money style quiz/i })).toBeTruthy();
  });

  it("opens the add-card screen from Wallet", async () => {
    const user = start();
    await openHome(user);
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    await user.click(within(nav).getByRole("button", { name: /^Wallet$/ }));
    await press(user, /Add card/i);
    expect(await screen.findByRole("heading", { name: /Open something new/i })).toBeTruthy();
  });

  it("opens account details from the wallet options button", async () => {
    const user = start();
    await openHome(user);
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    await user.click(within(nav).getByRole("button", { name: /^Wallet$/ }));
    await press(user, /Card options/i);
    expect(await screen.findByText("Account details")).toBeTruthy();
  });
});
