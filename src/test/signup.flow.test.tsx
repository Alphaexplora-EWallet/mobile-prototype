import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { createMockNetBankGateway } from "@/platform/web/createMockNetBankGateway";
import { MOCK_OTP_CODE, MOCK_TRANSACTION_PIN } from "@/core/data/mock/security.mock";
import { maskMobileNumber } from "@/core/domain/mobile";
import App from "../App";

/**
 * The registration process (ALP-32): Welcome now leads with "Create account",
 * and the five sign-up screens take a new user from mobile number to a ready
 * wallet — with the personality quiz right after, because that is what makes
 * FIN-A FIN-A. The flow maps onto `identity.users` in
 * docs/backend-architecture.md: mobile is the key, email is optional, and the
 * PIN goes to the gateway (`pin_hash`), never into a store.
 */

const MOBILE = "09175552288";
const NAME = "Ana Reyes";
const EMAIL = "ana.reyes@example.ph";
const PIN = "741963";

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

const type = async (user: ReturnType<typeof userEvent.setup>, label: string, value: string) =>
  user.type(screen.getByLabelText(label), value);

/** Welcome → the first sign-up screen. */
const openSignUp = async (user: ReturnType<typeof userEvent.setup>) => press(user, /Create account/i);

/** Walks the whole flow to the done screen, assuming the sign-up screen is up. */
const register = async (user: ReturnType<typeof userEvent.setup>) => {
  await type(user, "Mobile number", MOBILE);
  await press(user, /^Continue$/);
  expect(await screen.findByText(new RegExp(maskMobileNumber(MOBILE)))).toBeTruthy();
  await type(user, "One-time code", MOCK_OTP_CODE);
  await press(user, /Verify and continue/i);
  await type(user, "Full name", NAME);
  await type(user, "Email address", EMAIL);
  await press(user, /^Continue$/);
  await type(user, "Transaction PIN", PIN);
  await type(user, "Re-enter your PIN", PIN);
  await press(user, /Create my account/i);
};

describe("registration flow", () => {
  it("registers a new user end to end and lands them in the app", async () => {
    const user = start();

    // Welcome leads with registration now, alongside the quiz and sign-in.
    expect(screen.getByRole("button", { name: /Create account/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Start my journey/i })).toBeTruthy();

    // A malformed number is refused with the format message, not silently.
    await press(user, /Create account/i);
    await type(user, "Mobile number", "12345");
    await press(user, /^Continue$/);
    expect(await screen.findByRole("alert")).toHaveTextContent(/11-digit Philippine mobile/i);

    await user.clear(screen.getByLabelText("Mobile number"));
    await register(user);

    // The done screen greets the new person by first name. (Headings with a
    // line break lose the whitespace in their accessible name, hence \s*.)
    expect(await screen.findByRole("heading", { name: /Your wallet is\s*ready, Ana/i })).toBeTruthy();

    // The personality hook: registration hands over to the money-style quiz.
    await press(user, /Find my money style/i);
    expect(await screen.findByRole("heading", { name: /Find your money style/i })).toBeTruthy();
    await press(user, /I check my budget first/i);
    await press(user, /^Continue$/);
    await press(user, /Build my plan/i);

    // Home now belongs to the registered user, not the demo fixture.
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    await user.click(within(nav).getByRole("button", { name: /^Profile$/ }));
    expect(await screen.findByRole("heading", { name: NAME })).toBeTruthy();

    // The mobile is stored in display form, the MOCK_USER invariant.
    await press(user, /Personal details/i);
    expect(await screen.findByText("+63 917 555 2288")).toBeTruthy();
    expect(screen.getByText(EMAIL)).toBeTruthy();
  });

  it("rejects a wrong one-time code", async () => {
    const user = start();
    await press(user, /Create account/i);
    await type(user, "Mobile number", MOBILE);
    await press(user, /^Continue$/);
    await type(user, "One-time code", "000000");
    await press(user, /Verify and continue/i);
    expect(await screen.findByRole("alert")).toHaveTextContent(/not right/i);
    expect(screen.getByRole("heading", { name: /Check your phone/i })).toBeTruthy();
  });

  it("refuses mismatched PINs before creating the account", async () => {
    const user = start();
    await press(user, /Create account/i);
    await type(user, "Mobile number", MOBILE);
    await press(user, /^Continue$/);
    await type(user, "One-time code", MOCK_OTP_CODE);
    await press(user, /Verify and continue/i);
    await type(user, "Full name", NAME);
    await press(user, /^Continue$/);

    await type(user, "Transaction PIN", PIN);
    await type(user, "Re-enter your PIN", "741962");
    await press(user, /Create my account/i);
    expect(await screen.findByRole("alert")).toHaveTextContent(/do not match/i);

    // Correcting the confirmation completes the registration.
    await user.clear(screen.getByLabelText("Re-enter your PIN"));
    await type(user, "Re-enter your PIN", PIN);
    await press(user, /Create my account/i);
    expect(await screen.findByRole("heading", { name: /Your wallet is\s*ready, Ana/i })).toBeTruthy();
  });

  it("goes straight to the wallet from the done screen", async () => {
    const user = start();
    await openSignUp(user);
    await register(user);
    await press(user, /Go to my wallet/i);
    expect(screen.getByRole("navigation", { name: /primary navigation/i })).toBeTruthy();
  });

  it("returns to the welcome screen from the first step", async () => {
    const user = start();
    await openSignUp(user);
    await press(user, /Back to welcome/i);
    expect(screen.getByRole("heading", { name: /Money that\s*follows your life/i })).toBeTruthy();
  });

  it("surfaces a failed code request and clears the error on retype", async () => {
    const user = userEvent.setup();
    render(
      <BankingGatewayProvider gateway={createMockNetBankGateway({ failures: { "security.requestOtp": "network" } })}>
        <App />
      </BankingGatewayProvider>,
    );
    await press(user, /Create account/i);
    await type(user, "Mobile number", MOBILE);
    await press(user, /^Continue$/);

    // The intro stops pretending to send, and the reason is on screen.
    expect(await screen.findByRole("alert")).toHaveTextContent(/reach NetBank/i);
    expect(screen.getByText(/We could not send your code/i)).toBeTruthy();
  });

  it("steps back through every sign-up screen", async () => {
    const user = start();
    await openSignUp(user);
    await type(user, "Mobile number", MOBILE);
    await press(user, /^Continue$/);
    await type(user, "One-time code", MOCK_OTP_CODE);
    await press(user, /Verify and continue/i);
    await type(user, "Full name", NAME);
    await press(user, /^Continue$/);
    await type(user, "Transaction PIN", PIN);
    await type(user, "Re-enter your PIN", PIN);

    // PIN → details
    await press(user, /Back to home/i);
    expect(await screen.findByRole("heading", { name: /What should we call you/i })).toBeTruthy();
    // details → OTP
    await press(user, /Back to home/i);
    expect(await screen.findByRole("heading", { name: /Check your phone/i })).toBeTruthy();
    // OTP → mobile
    await press(user, /Back to home/i);
    expect(await screen.findByRole("heading", { name: /What's your\s*mobile number/i })).toBeTruthy();
    // mobile → welcome
    await press(user, /Back to welcome/i);
    expect(screen.getByRole("heading", { name: /Money that\s*follows your life/i })).toBeTruthy();
  });

  it("restores the demo PIN after sign-up and sign-out", async () => {
    const user = start();
    await openSignUp(user);
    await register(user);
    await press(user, /Go to my wallet/i);

    // Sign out from Profile.
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    await user.click(within(nav).getByRole("button", { name: /^Profile$/ }));
    await press(user, /^Sign out$/);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /^Sign out$/ }));

    // Back in as the demo user.
    expect(await screen.findByRole("button", { name: /Create account/i })).toBeTruthy();
    await press(user, /I already have an account/i);
    await press(user, /Continue with demo account/i);
    expect(await screen.findByText("Recent transactions")).toBeTruthy();

    // An InstaPay transfer steps up to the transaction PIN — which must be the
    // demo PIN again, not the one the sign-up chose (the gateway rewinds with
    // resetStores on sign-out; a page reload should not be required).
    await press(user, /^Send$/);
    await user.type(screen.getByRole("textbox", { name: /Amount to send/i }), "500");
    await press(user, /Add recipient/i);
    await press(user, /Send to a bank account/i);
    await press(user, /BDO Unibank/i);
    await user.type(screen.getByRole("textbox", { name: /Account number/i }), "003812340001");
    await press(user, /Check account name/i);
    expect(await screen.findByText(/Is that right\?/i)).toBeTruthy();
    await press(user, /InstaPay/i);
    await press(user, /^Continue$/);
    await press(user, /Continue to confirm/i);
    await user.type(screen.getByLabelText(/Transaction PIN/i), MOCK_TRANSACTION_PIN);
    await press(user, /Confirm payment/i);
    expect(await screen.findByRole("heading", { name: /Transfer complete/i })).toBeTruthy();
  });
});
