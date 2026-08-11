import { useEffect, useState } from "react";
import type { OtpChallenge } from "../domain/security";
import { MOCK_OTP_CODE } from "../data/mock/security.mock";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";

/**
 * The one-time code step. Signing in previously did nothing at all: the email
 * and password were component state that nothing read, and both buttons ran the
 * same `resetTo("home")`.
 */
export function useSignInOtpViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();

  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void gateway.security.requestOtp("sign-in").then((result) => {
      if (!active) return;
      if (result.ok) setChallenge(result.value);
      else setError(result.error.message);
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  const digits = challenge?.digits ?? 6;

  return {
    title: "Check your phone",
    intro: challenge ? `We sent a ${digits}-digit code to ${challenge.maskedDestination}.` : "Sending your code…",
    expiresLabel: challenge?.expiresInLabel ?? "",
    code,
    setCode: (value: string) => setCode(value.replace(/\D/g, "").slice(0, digits)),
    digits,
    canSubmit: code.length === digits && !isVerifying,
    isVerifying,
    error,
    hint: `Sandbox code: ${MOCK_OTP_CODE}`,
    submit: async () => {
      if (code.length !== digits) return;
      setIsVerifying(true);
      setError(null);
      const result = await gateway.security.verifyOtp("sign-in", code);
      setIsVerifying(false);
      if (!result.ok) {
        setError(result.error.message);
        setCode("");
        return;
      }
      navigation.resetTo("home");
    },
    resend: async () => {
      setError(null);
      const result = await gateway.security.requestOtp("sign-in");
      if (result.ok) setChallenge(result.value);
      else setError(result.error.message);
    },
    back: navigation.goBack,
  };
}

export function useForgotPasswordViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();

  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return {
    title: "Reset your password",
    intro: "Tell us the email on the account and we will send a reset link.",
    email,
    setEmail,
    canSubmit: /.+@.+\..+/.test(email) && !isSending && sentTo === null,
    isSending,
    error,
    sentTo,
    /**
     * The confirmation never says whether the address exists. Telling a stranger
     * which emails have accounts is a disclosure, not a courtesy.
     */
    confirmation: sentTo ? `If ${sentTo} has an account, a reset link is on its way.` : "",
    submit: async () => {
      if (!/.+@.+\..+/.test(email)) return;
      setIsSending(true);
      setError(null);
      const result = await gateway.security.requestOtp("password-reset");
      setIsSending(false);
      if (result.ok) setSentTo(email);
      else setError(result.error.message);
    },
    back: navigation.goBack,
  };
}
