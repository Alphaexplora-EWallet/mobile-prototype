import { useEffect, useState } from "react";
import type { OtpChallenge, OtpPurpose } from "../domain/security";
import type { AuthIntent } from "../domain/session";
import {
  isValidMobileNumber,
  maskMobileNumber,
  mobileNumberFormatMessage,
  normalizeMobileNumber,
  toNationalMobile,
} from "../domain/mobile";
import { MPIN_LENGTH, confirmPinIssue, pinIssue, pinIssueMessage } from "../domain/pin";
import { MOCK_MPIN, MOCK_OTP_CODE } from "../data/mock/security.mock";
import { MOCK_USER } from "../data/mock/user.mock";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { kycActions } from "../stores/kyc.store";
import { sessionActions, useSessionStore } from "../stores/session.store";
import { useSettingsStore } from "../stores/settings.store";

/**
 * Getting in and out of the app.
 *
 * The credential model is a Philippine wallet's: the mobile number is the
 * account key, a one-time code proves the number once, and a 6-digit MPIN is
 * what every login after that asks for. No password exists to be reset, which
 * is why "forgot password" became "forgot MPIN" and why the reset ends by
 * setting a new one rather than emailing a link.
 *
 * Every one of these hooks keeps its typed-in credential in local state and
 * hands it straight to the gateway. The MPIN reaches no store and no storage.
 */

/** The digits the OTP field expects before the challenge has come back. */
const DEFAULT_OTP_DIGITS = 6;

const otpPurposeFor = (intent: AuthIntent | null): OtpPurpose =>
  intent === "reset-pin" ? "password-reset" : "sign-up";

/**
 * Registration step 1. Checks the number is a number, then asks whether it is
 * already taken — being told "you already have a wallet" before typing a code is
 * the difference between a dead end and a signpost.
 */
export function useSignUpViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();

  const [mobile, setMobileInput] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = isValidMobileNumber(mobile);

  return {
    title: "Create your wallet",
    intro: "Your mobile number is your FIN-A wallet. We will text a code to confirm it is yours.",
    mobile,
    setMobile: (value: string) => {
      setError(null);
      setMobileInput(normalizeMobileNumber(value).slice(0, 11));
    },
    /** Shown once the field is long enough to be wrong rather than unfinished. */
    formatHint: mobile.length >= 11 && !valid ? mobileNumberFormatMessage() : null,
    accepted,
    toggleAccepted: setAccepted,
    consentLabel: "I agree to the Terms and Privacy Notice",
    consentDetail: "Simulated for the prototype — no agreement is recorded.",
    canSubmit: valid && accepted && !isChecking,
    isChecking,
    error,
    submit: async () => {
      if (!valid || !accepted) return;
      setIsChecking(true);
      setError(null);
      const national = toNationalMobile(mobile);
      const result = await gateway.auth.lookupMobile(national);
      setIsChecking(false);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      if (result.value.registered) {
        setError("That number already has a FIN-A wallet. Sign in instead.");
        return;
      }
      sessionActions.setMobile(national);
      sessionActions.setIntent("sign-up");
      navigation.navigate("auth-otp");
    },
    signIn: () => navigation.navigate("sign-in"),
    back: navigation.goBack,
  };
}

/**
 * The one-time-code step for both registration and MPIN reset. `intent` decides
 * the copy, which request sends the code, and where a verified code goes next —
 * the same reasoning that gave four money flows one `payment-*` pipeline.
 *
 * The destination shown is derived from the number in hand rather than read off
 * the challenge, so it is the number the user just typed and not the fixture's.
 */
export function useAuthOtpViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const mobile = useSessionStore((state) => state.mobile);
  const intent = useSessionStore((state) => state.intent);

  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purpose = otpPurposeFor(intent);
  const isSignUp = intent !== "reset-pin";

  useEffect(() => {
    let active = true;
    /**
     * Registration sends its code through `auth.startSignUp`, which is also the
     * server-side uniqueness check — the screen's earlier lookup is a courtesy,
     * not the guard. A reset goes through the shared OTP request, because there
     * is nothing to claim.
     */
    const request = isSignUp ? gateway.auth.startSignUp(mobile) : gateway.security.requestOtp("password-reset");
    void request.then((result) => {
      if (!active) return;
      if (result.ok) setChallenge(result.value);
      else setError(result.error.message);
    });
    return () => {
      active = false;
    };
  }, [gateway, mobile, isSignUp]);

  const digits = challenge?.digits ?? DEFAULT_OTP_DIGITS;

  return {
    pageTitle: isSignUp ? "Create your wallet" : "Reset your MPIN",
    title: "Check your phone",
    intro: `We sent a ${digits}-digit code to ${maskMobileNumber(mobile)}.`,
    expiresLabel: challenge?.expiresInLabel ?? "",
    code,
    setCode: (value: string) => setCode(value.replace(/\D/g, "").slice(0, digits)),
    digits,
    canSubmit: code.length === digits && !isVerifying,
    isVerifying,
    error,
    hint: `Sandbox code: ${MOCK_OTP_CODE}`,
    submitLabel: isVerifying ? "Checking your code…" : "Verify code",
    submit: async () => {
      if (code.length !== digits) return;
      setIsVerifying(true);
      setError(null);
      const result = await gateway.security.verifyOtp(purpose, code);
      setIsVerifying(false);
      if (!result.ok) {
        setError(result.error.message);
        setCode("");
        return;
      }
      /**
       * The token, not the code, is what the account-creating call will spend —
       * so it has to outlive this screen. It is opaque and single-use, which is
       * what makes holding it briefly acceptable where holding the MPIN is not.
       */
      sessionActions.setConfirmation(result.value);
      navigation.navigate(isSignUp ? "sign-up-profile" : "sign-up-pin");
    },
    resend: async () => {
      setError(null);
      setCode("");
      const result = isSignUp
        ? await gateway.auth.startSignUp(mobile)
        : await gateway.security.requestOtp("password-reset");
      if (result.ok) setChallenge(result.value);
      else setError(result.error.message);
    },
    back: navigation.goBack,
  };
}

/** Registration step 3: the name that goes on the account. */
export function useSignUpProfileViewModel() {
  const navigation = useNavigation();
  const storedName = useSessionStore((state) => state.fullName);
  const [fullName, setFullName] = useState(storedName);

  const trimmed = fullName.trim();

  return {
    title: "Create your wallet",
    intro: "Use the name printed on the ID you will verify with, so the two match later.",
    fullName,
    setFullName,
    canSubmit: trimmed.length >= 2,
    submit: () => {
      if (trimmed.length < 2) return;
      sessionActions.setFullName(trimmed);
      navigation.navigate("sign-up-pin");
    },
    back: navigation.goBack,
  };
}

/**
 * Sets the MPIN — and, for a registration, the step that actually creates the
 * account. Reset ends here too, so the two flows share one screen: the only
 * difference is which call the CTA makes, which `intent` already knows.
 *
 * The MPIN is submitted from local state and never stored. That is the whole
 * reason this is the last step rather than the third: an earlier PIN screen
 * would have had to park the PIN somewhere while the user typed their name.
 */
export function useSignUpPinViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const mobile = useSessionStore((state) => state.mobile);
  const fullName = useSessionStore((state) => state.fullName);
  const intent = useSessionStore((state) => state.intent);
  const confirmation = useSessionStore((state) => state.confirmation);

  const [pin, setPinInput] = useState("");
  const [confirm, setConfirmInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReset = intent === "reset-pin";
  const digitsOnly = (value: string) => value.replace(/\D/g, "").slice(0, MPIN_LENGTH);
  const complete = pin.length === MPIN_LENGTH && confirm.length === MPIN_LENGTH;

  return {
    pageTitle: isReset ? "Reset your MPIN" : "Create your wallet",
    title: isReset ? "Choose a new MPIN" : "Choose your MPIN",
    intro: `Your ${MPIN_LENGTH}-digit MPIN unlocks the app. It is not your transaction PIN — that one releases a payment.`,
    pin,
    setPin: (value: string) => {
      setError(null);
      setPinInput(digitsOnly(value));
    },
    confirm,
    setConfirm: (value: string) => {
      setError(null);
      setConfirmInput(digitsOnly(value));
    },
    digits: MPIN_LENGTH,
    rulesHint: "Avoid repeated digits or counting order.",
    canSubmit: complete && !isSubmitting,
    isSubmitting,
    error,
    submitLabel: isSubmitting ? "Setting up…" : isReset ? "Save new MPIN" : "Create my wallet",
    submit: async () => {
      if (!complete) return;
      /**
       * Checked here before the call as well as inside the gateway, so a weak
       * PIN is refused without a round trip and the rule is stated once, in the
       * domain, for both sides.
       */
      const weak = pinIssue(pin) ?? confirmPinIssue(pin, confirm);
      if (weak) {
        setError(pinIssueMessage(weak));
        if (weak === "mismatch") setConfirmInput("");
        return;
      }
      if (!confirmation) {
        setError("Your code has expired. Start again.");
        return;
      }

      setIsSubmitting(true);
      setError(null);
      const result = isReset
        ? await gateway.auth.resetPin({ mobile, pin, confirmation })
        : await gateway.auth.completeSignUp({ mobile, fullName, pin, confirmation });
      setIsSubmitting(false);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      sessionActions.signedIn(result.value);
      /**
       * A reset is a returning user, so Home. A new account goes to the money
       * style quiz: it is what the welcome screen promises, and it is only worth
       * asking once there is an account to attach the answer to.
       */
      navigation.resetTo(isReset ? "home" : "quiz");
    },
    back: navigation.goBack,
  };
}

/**
 * Signing in. Was a form whose email and password nothing read; it now takes the
 * number the account is keyed by and the MPIN set at registration.
 */
export function useSignInViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const biometricsEnabled = useSettingsStore((state) => state.biometricsEnabled);

  const [mobile, setMobileInput] = useState("");
  const [pin, setPinInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = isValidMobileNumber(mobile);

  const signIn = async (credentials: { mobile: string; pin: string }) => {
    setIsSubmitting(true);
    setError(null);
    const result = await gateway.auth.signIn(credentials);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error.message);
      setPinInput("");
      return;
    }
    sessionActions.signedIn(result.value);
    navigation.resetTo("home");
  };

  return {
    title: "Welcome back",
    intro: "Sign in with the number your wallet is registered to.",
    mobile,
    setMobile: (value: string) => {
      setError(null);
      setMobileInput(normalizeMobileNumber(value).slice(0, 11));
    },
    pin,
    setPin: (value: string) => {
      setError(null);
      setPinInput(value.replace(/\D/g, "").slice(0, MPIN_LENGTH));
    },
    digits: MPIN_LENGTH,
    canSubmit: valid && pin.length === MPIN_LENGTH && !isSubmitting,
    isSubmitting,
    error,
    submitLabel: isSubmitting ? "Signing you in…" : "Sign in",
    submit: () => void signIn({ mobile: toNationalMobile(mobile), pin }),
    /**
     * Cosmetic, and labelled as such. `biometricsEnabled` is a preference with
     * no port behind it, so pressing this can only do what the MPIN does — it is
     * here because a wallet without the affordance does not look like a wallet.
     */
    biometricsEnabled,
    biometricLabel: "Use fingerprint instead",
    useBiometrics: () => void signIn({ mobile: toNationalMobile(MOCK_USER.mobile), pin: MOCK_MPIN }),
    /** Signs into the seeded account for real, rather than skipping the gate. */
    demoLabel: "Continue with demo account",
    demoHint: `Sandbox wallet ${maskMobileNumber(toNationalMobile(MOCK_USER.mobile))}, MPIN ${MOCK_MPIN}.`,
    useDemoAccount: () => void signIn({ mobile: toNationalMobile(MOCK_USER.mobile), pin: MOCK_MPIN }),
    forgotPin: () => navigation.navigate("forgot-pin"),
    createAccount: () => navigation.navigate("sign-up"),
    back: () => navigation.navigate("welcome"),
  };
}

/**
 * MPIN recovery. Sends a code to the number and then reuses the set-MPIN screen,
 * so the recovery path has no screens of its own beyond this one.
 */
export function useForgotPinViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();

  const [mobile, setMobileInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = isValidMobileNumber(mobile);

  return {
    title: "Reset your MPIN",
    intro: "Tell us the number on the wallet and we will text a code to confirm it is yours.",
    mobile,
    setMobile: (value: string) => {
      setError(null);
      setMobileInput(normalizeMobileNumber(value).slice(0, 11));
    },
    formatHint: mobile.length >= 11 && !valid ? mobileNumberFormatMessage() : null,
    canSubmit: valid && !isSending,
    isSending,
    error,
    submitLabel: isSending ? "Sending…" : "Send code",
    /**
     * The code is requested for any well-formed number, registered or not, and
     * the next screen says the same thing either way. Telling a stranger which
     * numbers have wallets is a disclosure, not a courtesy — the same reason the
     * old email version never confirmed an address.
     */
    submit: async () => {
      if (!valid) return;
      setIsSending(true);
      setError(null);
      const result = await gateway.security.requestOtp("password-reset");
      setIsSending(false);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      sessionActions.setMobile(toNationalMobile(mobile));
      sessionActions.setIntent("reset-pin");
      navigation.navigate("auth-otp");
    },
    back: navigation.goBack,
  };
}

/**
 * The KYC hand-off a new account meets once onboarding is done. It offers the
 * capture flow that already exists rather than adding steps to it, and it is
 * skippable: a prototype that traps a new user in compliance is not walkable.
 */
export function useVerifyIdentityViewModel() {
  const navigation = useNavigation();
  return {
    title: "Verify your identity",
    intro: "Verified wallets send more, hold more, and can cash out. It takes about two minutes.",
    benefits: [
      "Raise your sending and wallet limits",
      "Cash out to any bank or e-wallet",
      "Keep your account when limits change",
    ],
    verifyLabel: "Verify now",
    /** The same pair `useKycStatusViewModel.startVerification` uses. */
    verify: () => {
      kycActions.reset();
      navigation.navigate("kyc-capture");
    },
    laterLabel: "Maybe later",
    later: () => navigation.resetTo("home"),
  };
}
