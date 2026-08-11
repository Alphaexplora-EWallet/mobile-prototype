import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { createMockNetBankGateway } from "@/platform/web/createMockNetBankGateway";
import { ONLY_ACCOUNT_BLOCK_MESSAGE } from "@/core/stores/accounts.store";
import App from "../App";

/**
 * GAP-09 linked bank accounts: the manage screen reached from Settings, with
 * list / add / remove / set-default, and the only-account removal block.
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

/** Onboarding → home → Profile → Settings → Linked accounts. */
const openLinkedAccounts = async (user: ReturnType<typeof userEvent.setup>) => {
  await press(user, /Start my journey/i);
  await press(user, /^Continue$/);
  await press(user, /Build my plan/i);
  const nav = screen.getByRole("navigation", { name: /primary navigation/i });
  await user.click(within(nav).getByRole("button", { name: /^Profile$/ }));
  await press(user, /Profile options/i);
  await press(user, /Linked accounts/i);
};

describe("linked bank accounts", () => {
  it("lists the accounts seeded from MOCK_ACCOUNTS with the default marked", async () => {
    const user = start();
    await openLinkedAccounts(user);

    // Both deposit accounts behind the card faces are listed.
    expect(screen.getAllByText("NetBank (A Rural Bank), Inc.")).toHaveLength(2);
    expect(screen.getByText("•••• 6789 · MAYA SANTOS")).toBeTruthy();
    expect(screen.getByText("•••• 1198 · MAYA SANTOS")).toBeTruthy();

    // The first account is the default: badge once, its star pressed + disabled.
    expect(screen.getAllByText("Default")).toHaveLength(1);
    const defaultStar = screen.getByRole("button", {
      name: "Make NetBank (A Rural Bank), Inc. •••• 6789 default",
    });
    expect(defaultStar).toHaveAttribute("aria-pressed", "true");
    expect(defaultStar).toBeDisabled();
  });

  it("marks another account as the default transfer source", async () => {
    const user = start();
    await openLinkedAccounts(user);

    await press(user, "Make NetBank (A Rural Bank), Inc. •••• 1198 default");

    expect(screen.getAllByText("Default")).toHaveLength(1);
    const travelStar = screen.getByRole("button", {
      name: "Make NetBank (A Rural Bank), Inc. •••• 1198 default",
    });
    expect(travelStar).toHaveAttribute("aria-pressed", "true");
    expect(travelStar).toBeDisabled();
    const mainStar = screen.getByRole("button", {
      name: "Make NetBank (A Rural Bank), Inc. •••• 6789 default",
    });
    expect(mainStar).toHaveAttribute("aria-pressed", "false");
    expect(mainStar).toBeEnabled();
  });

  it("removes an account and promotes the default when it was removed", async () => {
    const user = start();
    await openLinkedAccounts(user);

    // Make the travel account default, then remove it.
    await press(user, "Make NetBank (A Rural Bank), Inc. •••• 1198 default");
    await press(user, "Remove NetBank (A Rural Bank), Inc. •••• 1198");

    expect(screen.getAllByText("NetBank (A Rural Bank), Inc.")).toHaveLength(1);
    // The default moved to the remaining account rather than vanishing.
    expect(screen.getAllByText("Default")).toHaveLength(1);
    const mainStar = screen.getByRole("button", {
      name: "Make NetBank (A Rural Bank), Inc. •••• 6789 default",
    });
    expect(mainStar).toHaveAttribute("aria-pressed", "true");
  });

  it("blocks removing the only account left with a message", async () => {
    const user = start();
    await openLinkedAccounts(user);

    await press(user, "Remove NetBank (A Rural Bank), Inc. •••• 1198");
    await press(user, "Remove NetBank (A Rural Bank), Inc. •••• 6789");

    // The error surface appears with the block message and the row survives.
    expect(screen.getByRole("heading", { name: "Account kept" })).toBeTruthy();
    expect(screen.getByText(ONLY_ACCOUNT_BLOCK_MESSAGE)).toBeTruthy();
    expect(screen.getAllByText("NetBank (A Rural Bank), Inc.")).toHaveLength(1);
    expect(screen.getByText("•••• 6789 · MAYA SANTOS")).toBeTruthy();
  });

  it("links a new bank account and it unblocks further removal", async () => {
    const user = start();
    await openLinkedAccounts(user);

    await press(user, /Link a bank account/i);
    await press(user, /^BPI/);
    await user.type(screen.getByRole("textbox", { name: "Account number" }), "004823016612");
    await user.type(screen.getByRole("textbox", { name: "Account name" }), "MAYA SANTOS");
    await press(user, /Link account/i);

    // The form closes and the new account appears in the list.
    expect(screen.getByText("Bank of the Philippine Islands")).toBeTruthy();
    expect(screen.getByText("•••• 6612 · MAYA SANTOS")).toBeTruthy();

    // With two accounts left, the previously-last one can now be removed.
    await press(user, "Remove NetBank (A Rural Bank), Inc. •••• 6789");
    expect(screen.queryByText("•••• 6789 · MAYA SANTOS")).toBeNull();
    expect(screen.getByText("•••• 6612 · MAYA SANTOS")).toBeTruthy();

    // Removing the BPI account succeeds too — two accounts were still left.
    await press(user, "Remove Bank of the Philippine Islands •••• 6612");
    expect(screen.queryByText("•••• 6612 · MAYA SANTOS")).toBeNull();

    // The seeded travel account is now the only one: blocked again.
    await press(user, "Remove NetBank (A Rural Bank), Inc. •••• 1198");
    expect(screen.getByText(ONLY_ACCOUNT_BLOCK_MESSAGE)).toBeTruthy();
    expect(screen.getByText("•••• 1198 · MAYA SANTOS")).toBeTruthy();
  });

  it("does not link the same bank account twice", async () => {
    const user = start();
    await openLinkedAccounts(user);

    await press(user, /Link a bank account/i);
    await press(user, /^BPI/);
    await user.type(screen.getByRole("textbox", { name: "Account number" }), "004823016612");
    await user.type(screen.getByRole("textbox", { name: "Account name" }), "MAYA SANTOS");
    await press(user, /Link account/i);

    // Reopen the form and link the same bank + number again.
    await press(user, /Link a bank account/i);
    await press(user, /^BPI/);
    await user.type(screen.getByRole("textbox", { name: "Account number" }), "004823016612");
    await user.type(screen.getByRole("textbox", { name: "Account name" }), "MAYA SANTOS");
    await press(user, /Link account/i);

    expect(screen.getAllByText("Bank of the Philippine Islands")).toHaveLength(1);
  });
});
