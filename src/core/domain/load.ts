import type { IconName } from "./icons";

/**
 * A mobile network that sells prepaid load. The number-to-operator rules are
 * prefix based: a valid Philippine mobile number is "09" plus nine more digits,
 * and the first four digits tell which network owns it.
 *
 * The prefix lists in `data/mock/payments.mock.ts` are representative, not
 * exhaustive — enough to exercise every validation branch without pretending
 * this prototype holds a real NTC number registry.
 */
export type LoadOperator = {
  id: string;
  icon: IconName;
  name: string;
  detail: string;
  /** 4-digit prefixes (e.g. "0917") whose numbers belong to this operator. */
  prefixes: readonly string[];
};

/** Philippine mobile numbers are "09" + nine more digits. */
export const PH_MOBILE_LENGTH = 11;

/** "0917-123 4567" → "09171234567". Spaces and dashes are typist-friendly. */
export const normalizePhoneDigits = (raw: string): string => raw.replace(/\D/g, "");

/**
 * "09174562288" → "09••• •••288". The review hero and the receipt render this
 * form; the raw number never leaves the intent.
 */
export const maskMobileNumber = (raw: string): string => {
  const digits = normalizePhoneDigits(raw);
  if (digits.length < 6) return digits;
  return `${digits.slice(0, 2)}••• •••${digits.slice(-3)}`;
};

export type MobileNumberIssue = "empty" | "incomplete" | "not-mobile" | "wrong-network";

/**
 * Why a number cannot be loaded. `wrong-network` is the interesting one: the
 * digits are a real mobile number, just not on the operator the user picked —
 * which is exactly what the operator→prefix rules exist to catch.
 */
export const validateMobileNumber = (raw: string, operator: LoadOperator): MobileNumberIssue | null => {
  const digits = normalizePhoneDigits(raw);
  if (digits.length === 0) return "empty";
  if (digits.length !== PH_MOBILE_LENGTH) return "incomplete";
  if (!digits.startsWith("09")) return "not-mobile";
  const prefix = digits.slice(0, 4);
  if (!operator.prefixes.includes(prefix)) return "wrong-network";
  return null;
};

export const mobileNumberErrorMessage = (issue: MobileNumberIssue, operator: LoadOperator): string => {
  if (issue === "wrong-network") return `That number is not on ${operator.name}'s network.`;
  if (issue === "empty") return "Enter the mobile number you're loading.";
  if (issue === "incomplete") return `Mobile numbers are ${PH_MOBILE_LENGTH} digits, starting with 09.`;
  return "Mobile numbers start with 09.";
};
