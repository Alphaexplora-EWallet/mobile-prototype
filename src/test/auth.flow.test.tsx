import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { press, renderHydrating, renderSignedOut, storagePlatform, type TestUser } from "@/test/helpers/renderApp";
import { MOCK_MPIN, MOCK_OTP_CODE } from "@/core/data/mock/security.mock";
import { MOCK_SESSIONS } from "@/core/data/mock/security.mock";
import { MOCK_USER } from "@/core/data/mock/user.mock";
import { SESSION_STORAGE_KEY } from "@/app/bridges/SessionBridge";
import { noopPlatform } from "@/core/platform/noopPlatform";
import type { Platform } from "@/core/platform/ports";
import type { AuthSession } from "@/core/domain/session";

/**
 * Signing up, signing in, and getting back in after forgetting the MPIN.
 *
 * The app used to have none of this: "signed in" was whichever screen the stack
 * was rooted on, the sign-in form's email and password were state nothing read,
 * and a reload signed you out. These tests are the evidence that a session is
 * now a fact the app holds rather than a screen it happens to be showing.
 *
 * Every test here starts signed out, which is what `renderSignedOut` is for —
 * the rest of the suite seeds a session instead, because re-onboarding to reach
 * a cash-out screen tested onboarding, not cash-out.
 */

/** The registered fixture wallet, in the national form the field accepts. */
const REGISTERED = "09175552288";
const NEW_NUMBER = "09171234567";
const GOOD_PIN = "482913";

const start = (options = {}, platform: Platform = noopPlatform) => renderSignedOut(options, platform).user;

const type = async (user: TestUser, label: RegExp | string, value: string) =>
  user.type(screen.getByRole("textbox", { name: label }), value);

/** The MPIN and code fields are password/text inputs queried by their label. */
const fill = async (user: TestUser, label: RegExp | string, value: string) =>
  user.type(screen.getByLabelText(label), value);

/** Welcome → mobile → code, the shared head of every registration. */
const startSignUp = async (user: TestUser, mobile = NEW_NUMBER) => {
  await press(user, /Start my journey/i);
  await type(user, /Mobile number/i, mobile);
  await user.click(screen.getByRole("switch", { name: /Terms and Privacy/i }));
  await press(user, /Send me a code/i);
};

describe("sign-up", () => {
  it("registers a new number through code, name and MPIN, then opens the quiz", async () => {
    const user = start();
    await startSignUp(user);

    // The code screen names the number that was just typed, not the fixture's.
    expect(await screen.findByRole("heading", { name: /Check your phone/i })).toBeTruthy();
    expect(screen.getByText(/0917 ••• 4567/)).toBeTruthy();

    await fill(user, /One-time code/i, MOCK_OTP_CODE);
    await press(user, /Verify code/i);

    expect(await screen.findByRole("heading", { name: /What should we call you/i })).toBeTruthy();
    await type(user, /Full name/i, "Ana Reyes");
    await press(user, /^Continue$/);

    expect(await screen.findByRole("heading", { name: /Choose your MPIN/i })).toBeTruthy();
    await fill(user, /New MPIN/i, GOOD_PIN);
    await fill(user, /Confirm MPIN/i, GOOD_PIN);
    await press(user, /Create my wallet/i);

    // The money-style quiz is onboarding, and it now runs on a real account.
    expect(await screen.findByRole("heading", { name: /Find your money style/i })).toBeTruthy();
  });

  it("refuses a number that already has a wallet, before asking for a code", async () => {
    const user = start();
    await startSignUp(user, REGISTERED);

    expect(await screen.findByRole("alert")).toHaveTextContent(/already has a FIN-A wallet/i);
    expect(screen.queryByRole("heading", { name: /Check your phone/i })).toBeNull();
  });

  it("will not send a code until the number is valid and the terms are accepted", async () => {
    const user = start();
    await press(user, /Start my journey/i);
    await type(user, /Mobile number/i, "0917555");

    const cta = screen.getByRole("button", { name: /Send me a code/i });
    expect(cta).toBeDisabled();

    // A complete number is still not enough on its own.
    await type(user, /Mobile number/i, "2288");
    expect(cta).toBeDisabled();
    await user.click(screen.getByRole("switch", { name: /Terms and Privacy/i }));
    expect(cta).toBeEnabled();
  });

  it("keeps you on the code step when the code is wrong", async () => {
    const user = start();
    await startSignUp(user);
    await fill(user, /One-time code/i, "000000");
    await press(user, /Verify code/i);

    expect(await screen.findByRole("alert")).toHaveTextContent(/code is not right/i);
    expect(screen.queryByRole("heading", { name: /What should we call you/i })).toBeNull();
  });

  it("rejects a guessable MPIN and a mismatched confirmation", async () => {
    const user = start();
    await startSignUp(user);
    await fill(user, /One-time code/i, MOCK_OTP_CODE);
    await press(user, /Verify code/i);
    await type(user, /Full name/i, "Ana Reyes");
    await press(user, /^Continue$/);

    await fill(user, /New MPIN/i, "123456");
    await fill(user, /Confirm MPIN/i, "123456");
    await press(user, /Create my wallet/i);
    expect(await screen.findByRole("alert")).toHaveTextContent(/counting order/i);

    await user.clear(screen.getByLabelText(/New MPIN/i));
    await fill(user, /New MPIN/i, GOOD_PIN);
    await fill(user, /Confirm MPIN/i, "482914");
    await press(user, /Create my wallet/i);
    expect(await screen.findByRole("alert")).toHaveTextContent(/must match/i);

    // Still on the MPIN step: nothing was created on either refusal.
    expect(screen.getByRole("heading", { name: /Choose your MPIN/i })).toBeTruthy();
  });
});

describe("sign-in", () => {
  it("signs in with the registered number and MPIN", async () => {
    const user = start();
    await press(user, /I already have an account/i);
    await type(user, /Mobile number/i, REGISTERED);
    await fill(user, /MPIN/i, MOCK_MPIN);
    await press(user, /^Sign in$/);

    expect(await screen.findByText("Recent transactions")).toBeTruthy();
  });

  it("counts wrong MPINs down and then makes you reset", async () => {
    const user = start();
    await press(user, /I already have an account/i);
    await type(user, /Mobile number/i, REGISTERED);

    for (const remaining of [/2 tries left/i, /1 try left/i, /Too many wrong attempts/i]) {
      await fill(user, /MPIN/i, "482900");
      await press(user, /^Sign in$/);
      expect(await screen.findByRole("alert")).toHaveTextContent(remaining);
    }

    // Even the right MPIN is refused once the attempts are spent.
    await fill(user, /MPIN/i, MOCK_MPIN);
    await press(user, /^Sign in$/);
    expect(await screen.findByRole("alert")).toHaveTextContent(/Too many wrong attempts/i);
  });

  it("says when a number has no wallet at all", async () => {
    const user = start();
    await press(user, /I already have an account/i);
    await type(user, /Mobile number/i, "09990001122");
    await fill(user, /MPIN/i, MOCK_MPIN);
    await press(user, /^Sign in$/);

    expect(await screen.findByRole("alert")).toHaveTextContent(/No FIN-A wallet uses that number/i);
  });

  it("opens a real session from the demo shortcut, not a bypass", async () => {
    const platform = storagePlatform();
    const { user } = renderSignedOut({}, platform);
    await press(user, /I already have an account/i);
    await press(user, /Continue with demo account/i);

    expect(await screen.findByText("Recent transactions")).toBeTruthy();
    // A bypass would not have written a token for a reload to find.
    expect(await platform.storage.getItem(SESSION_STORAGE_KEY)).toBeTruthy();
  });
});

describe("forgotten MPIN", () => {
  it("sends a code, sets a new MPIN, and signs you in", async () => {
    const user = start();
    await press(user, /I already have an account/i);
    await press(user, /Forgot MPIN/i);

    await type(user, /Mobile number/i, REGISTERED);
    await press(user, /Send code/i);

    expect(await screen.findByRole("heading", { name: /Check your phone/i })).toBeTruthy();
    await fill(user, /One-time code/i, MOCK_OTP_CODE);
    await press(user, /Verify code/i);

    // The set-MPIN screen is reused, in reset wording.
    expect(await screen.findByRole("heading", { name: /Choose a new MPIN/i })).toBeTruthy();
    await fill(user, /New MPIN/i, GOOD_PIN);
    await fill(user, /Confirm MPIN/i, GOOD_PIN);
    await press(user, /Save new MPIN/i);

    expect(await screen.findByText("Recent transactions")).toBeTruthy();
  });

  it("never confirms whether a number has a wallet", async () => {
    const user = start();
    await press(user, /I already have an account/i);
    await press(user, /Forgot MPIN/i);
    await type(user, /Mobile number/i, "09990001122");
    await press(user, /Send code/i);

    // Same screen, same words as a number that does have a wallet.
    expect(await screen.findByRole("heading", { name: /Check your phone/i })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("session persistence", () => {
  /** A platform whose storage already holds a token, as a reload would. */
  const storageWith = (token: string) => storagePlatform({ [SESSION_STORAGE_KEY]: token });

  const SEEDED: AuthSession = {
    token: "sess-stored",
    user: MOCK_USER,
    deviceName: MOCK_SESSIONS[0].deviceName,
  };

  it("opens on Home when storage holds a token the gateway still knows", async () => {
    renderHydrating({ session: SEEDED }, storageWith(SEEDED.token));
    expect(await screen.findByText("Recent transactions")).toBeTruthy();
  });

  it("opens on Welcome when the stored token has expired", async () => {
    // No `session` option, so the gateway recognises no token at all.
    renderHydrating({}, storageWith("sess-expired"));
    expect(await screen.findByRole("button", { name: /Start my journey/i })).toBeTruthy();
  });

  it("signing out clears the token, so a reload does not get back in", async () => {
    const platform = storageWith(SEEDED.token);
    const { user } = renderHydrating({ session: SEEDED }, platform);

    expect(await screen.findByText("Recent transactions")).toBeTruthy();
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    await user.click(within(nav).getByRole("button", { name: /^Profile$/ }));
    await press(user, /^Sign out$/);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /^Sign out$/ }));

    expect(await screen.findByRole("button", { name: /Start my journey/i })).toBeTruthy();
    expect(await platform.storage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});

describe("the session gate", () => {
  it("keeps a signed-out visitor out of the tab screens", async () => {
    const user = start();
    await press(user, /Start my journey/i);

    // No tab bar exists to reach Home with while signed out.
    expect(screen.queryByRole("navigation", { name: /primary navigation/i })).toBeNull();
    expect(screen.queryByText("Recent transactions")).toBeNull();
  });

  it("offers verification once the account exists, and lets it wait", async () => {
    const user = start();
    await press(user, /I already have an account/i);
    await press(user, /Continue with demo account/i);
    expect(await screen.findByText("Recent transactions")).toBeTruthy();

    // The nudge is reachable from the end of onboarding; here, straight from
    // Profile's verification row, which is where it lives permanently.
    const nav = screen.getByRole("navigation", { name: /primary navigation/i });
    await user.click(within(nav).getByRole("button", { name: /^Profile$/ }));
    await press(user, /VerificationYour tier/i);
    expect(await screen.findByRole("heading", { name: "Verified" })).toBeTruthy();
  });
});
