import { useEffect, useState } from "react";
import {
  formatMobileDisplay,
  isValidMobileNumber,
  mobileNumberFormatMessage,
  normalizeMobileNumber,
} from "../domain/mobile";
import type { OtpChallenge } from "../domain/security";
import { MOCK_OTP_CODE } from "../data/mock/security.mock";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { registrationActions, useRegistrationStore } from "../stores/registration.store";
import { userActions, useUserStore } from "../stores/user.store";

/**
 * The registration process, as a real flow rather than a single button that
 * lands on Home: mobile → one-time code → name and email → transaction PIN →
 * done. It maps onto `identity.users` in docs/backend-architecture.md (mobile
 * is the unique key, email is optional, the PIN hash is the only trace the
 * device keeps) and the per-user NetBank account model in
 * docs/multi-user-model.md.
 *
 * The draft lives in `registration.store.ts` so it survives navigation; the
 * PIN is deliberately not stored — it goes straight to `security.setPin`.
 */

export function useSignUpViewModel() {
  const navigation = useNavigation();
  const storedMobile = useRegistrationStore((state) => state.mobile);
  const [mobile, setMobile] = useState(storedMobile);
  const [attempted, setAttempted] = useState(false);

  const valid = isValidMobileNumber(mobile);

  return {
    title: "Create your account",
    intro: "A FIN-A wallet is tied to your mobile number — this is how you sign in and receive codes.",
    mobile,
    setMobile: (value: string) => {
      setMobile(normalizeMobileNumber(value).slice(0, 11));
      setAttempted(false);
    },
    error: attempted && !valid ? mobileNumberFormatMessage() : null,
    continue: () => {
      if (!valid) {
        setAttempted(true);
        return;
      }
      registrationActions.setMobile(mobile);
      navigation.navigate("sign-up-otp");
    },
    signIn: () => navigation.navigate("sign-in"),
    back: () => navigation.navigate("welcome"),
  };
}

export function useSignUpOtpViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const mobile = useRegistrationStore((state) => state.mobile);

  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void gateway.security.requestOtp("sign-up", mobile).then((result) => {
      if (!active) return;
      if (result.ok) setChallenge(result.value);
      else setError(result.error.message);
    });
    return () => {
      active = false;
    };
  }, [gateway, mobile]);

  const digits = challenge?.digits ?? 6;

  return {
    title: "Check your phone",
    intro: challenge
      ? `We sent a ${digits}-digit code to ${challenge.maskedDestination}.`
      : error
        ? "We could not send your code. Check your connection and try again."
        : "Sending your code…",
    expiresLabel: challenge?.expiresInLabel ?? "",
    code,
    setCode: (value: string) => {
      setCode(value.replace(/\D/g, "").slice(0, digits));
      setError(null);
    },
    digits,
    canSubmit: code.length === digits && !isVerifying,
    isVerifying,
    error,
    hint: `Sandbox code: ${MOCK_OTP_CODE}`,
    submit: async () => {
      if (code.length !== digits) return;
      setIsVerifying(true);
      setError(null);
      const result = await gateway.security.verifyOtp("sign-up", code);
      setIsVerifying(false);
      if (!result.ok) {
        setError(result.error.message);
        setCode("");
        return;
      }
      navigation.navigate("sign-up-details");
    },
    resend: async () => {
      setError(null);
      const result = await gateway.security.requestOtp("sign-up", mobile);
      if (result.ok) setChallenge(result.value);
      else setError(result.error.message);
    },
    back: navigation.goBack,
  };
}

export function useSignUpDetailsViewModel() {
  const navigation = useNavigation();
  const storedFullName = useRegistrationStore((state) => state.fullName);
  const storedEmail = useRegistrationStore((state) => state.email);

  const [fullName, setFullName] = useState(storedFullName);
  const [email, setEmail] = useState(storedEmail);
  const [attempted, setAttempted] = useState(false);

  const nameValid = fullName.trim().length >= 2;
  const emailValid = email.trim() === "" || /.+@.+\..+/.test(email.trim());
  const valid = nameValid && emailValid;

  return {
    title: "What should we call you?",
    intro: "Your name appears on your cards and receipts. Email is optional — it is only for receipts.",
    fullName,
    setFullName,
    email,
    setEmail,
    error: attempted && !valid ? "Add your full name, and check the email address." : null,
    continue: () => {
      if (!valid) {
        setAttempted(true);
        return;
      }
      registrationActions.setFullName(fullName.trim());
      registrationActions.setEmail(email.trim());
      navigation.navigate("sign-up-pin");
    },
    back: navigation.goBack,
  };
}

export function useSignUpPinViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const fullName = useRegistrationStore((state) => state.fullName);
  const mobile = useRegistrationStore((state) => state.mobile);
  const email = useRegistrationStore((state) => state.email);

  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const clean = (value: string) => value.replace(/\D/g, "").slice(0, 6);
  const pinValid = pin.length === 6;
  const match = pinValid && pin === confirm;

  return {
    title: "Create a transaction PIN",
    intro: "This 6-digit PIN confirms payments and keeps your money yours. It never leaves this device.",
    pin,
    setPin: (value: string) => {
      setPin(clean(value));
      setAttempted(false);
      setError(null);
    },
    confirm,
    setConfirm: (value: string) => {
      setConfirm(clean(value));
      setAttempted(false);
      setError(null);
    },
    canSubmit: pinValid && match && !isSaving,
    isSaving,
    error,
    /** The inline message under the fields — validation first, server second. */
    fieldError:
      attempted && !pinValid
        ? "Your transaction PIN is exactly 6 digits."
        : attempted && !match
          ? "Those PINs do not match. Try again."
          : null,
    submit: async () => {
      if (!pinValid || !match) {
        setAttempted(true);
        return;
      }
      setIsSaving(true);
      setError(null);
      const result = await gateway.security.setPin(pin);
      setIsSaving(false);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      // The account is created: `identity.users` gets the registered details,
      // replacing the demo fixture this prototype ships with. The mobile is
      // stored in display form, the same invariant MOCK_USER upholds.
      userActions.setFullName(fullName);
      userActions.setMobile(formatMobileDisplay(mobile));
      userActions.setEmail(email);
      userActions.setMemberSinceLabel("Just joined");
      navigation.navigate("sign-up-done");
    },
    back: navigation.goBack,
  };
}

export function useSignUpDoneViewModel() {
  const navigation = useNavigation();
  const fullName = useUserStore((state) => state.fullName);
  const firstName = fullName.trim().split(/\s+/)[0] || "there";

  return {
    firstName,
    takeQuiz: () => navigation.navigate("quiz"),
    goToWallet: () => navigation.resetTo("home"),
  };
}
