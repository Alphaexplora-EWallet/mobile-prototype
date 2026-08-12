import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { createMockNetBankGateway, type MockGatewayOptions } from "@/platform/web/createMockNetBankGateway";
import App from "../App";

/**
 * The KYC resubmission path (GAP-10): a rejected submission shows the reason
 * and restarts capture at the step that failed review, and a successful
 * re-capture returns the account to the approved tier.
 */

/** The mock's seeded rejection: the selfie (step index 3 of 0-4) failed review. */
const REJECTION = { reason: "The selfie was too dark to match your ID photo.", stepIndex: 3 };

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

/** Onboards to Home and opens the Profile hub, where Verification now lives. */
const openProfile = async (user: ReturnType<typeof userEvent.setup>) => {
  await press(user, /Start my journey/i);
  await press(user, /^Continue$/);
  await press(user, /Build my plan/i);
  const nav = screen.getByRole("navigation", { name: /primary navigation/i });
  await user.click(within(nav).getByRole("button", { name: /^Profile$/ }));
};

describe("KYC resubmission path", () => {
  it("shows the rejection reason with a resubmit action", async () => {
    const user = start({ kycRejection: REJECTION });
    await openProfile(user);
    await press(user, /VerificationYour tier/i);

    expect(await screen.findByRole("alert")).toHaveTextContent(/too dark/i);
    expect(screen.getByRole("heading", { name: /rejected/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Resubmit/i })).toBeTruthy();
    // A rejection means there is something to resubmit, not a fresh start.
    expect(screen.queryByRole("button", { name: /Start verification/i })).toBeNull();
  });

  it("restarts capture at the failed step on resubmit", async () => {
    const user = start({ kycRejection: REJECTION });
    await openProfile(user);
    await press(user, /VerificationYour tier/i);
    await press(user, /Resubmit/i);

    // Step 4 of 5 is the selfie — the step the rejection pointed at.
    expect(await screen.findByText("Step 4 of 5")).toBeTruthy();
    expect(screen.getByText(/Take a selfie/i)).toBeTruthy();
    expect(screen.getByRole("status", { name: /Resubmission notice/i })).toBeTruthy();
    // The progress track is exposed as a real progressbar with a percentage.
    expect(screen.getByRole("progressbar", { name: /Step 4 of 5/i })).toHaveAttribute("aria-valuenow", "80");
  });

  it("returns to the expected status after a successful re-capture", async () => {
    const user = start({ kycRejection: REJECTION });
    await openProfile(user);
    await press(user, /VerificationYour tier/i);
    await press(user, /Resubmit/i);

    // The failed step's artifact was cleared, so it reads "Capture" again.
    expect(await screen.findByText("Step 4 of 5")).toBeTruthy();
    await press(user, /^Capture$/);
    await press(user, /^Continue$/);

    expect(await screen.findByText("Step 5 of 5")).toBeTruthy();
    await user.type(screen.getByRole("textbox", { name: /Street address/i }), "12 Mabini St");
    await user.type(screen.getByRole("textbox", { name: /^City$/i }), "Quezon City");
    await press(user, /Submit for review/i);

    // The resubmission passed review: promoted to Fully verified, no rejection.
    expect(await screen.findByRole("heading", { name: "Fully verified" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: /Resubmit/i })).toBeNull();
  });
});
