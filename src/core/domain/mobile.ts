/**
 * Philippine mobile numbers: how a FIN-A wallet keyed by phone is addressed.
 *
 * Kept in the domain (not the mock) because the same rules are used on both
 * sides of the seam — the screen validates the input before asking, and the
 * gateway re-validates the digits it is handed, so neither trusts the other.
 */

/** National format: exactly 11 digits starting with 09 (e.g. 09174562288). */
const MOBILE_PATTERN = /^09\d{9}$/;

/** Strips everything that is not a digit, for sanitising input as it is typed. */
export const normalizeMobileNumber = (value: string): string => value.replace(/\D/g, "");

/**
 * Sanitises a mobile field as it is typed or pasted: digits only, and
 * international input ("+63 917 555 2288") is folded into the national 09-form
 * the app stores and validates. Anything else is passed through for the
 * validation rules to judge.
 */
export const normalizeMobileInput = (value: string): string => {
  const digits = normalizeMobileNumber(value);
  if (digits.startsWith("63") && digits.length === 12) return `0${digits.slice(2)}`;
  return digits;
};

/**
 * Whether a value is a well-formed Philippine mobile number. Accepts the digits
 * alone or with the usual spacing ("0917 456 2288") — anything else fails.
 */
export const isValidMobileNumber = (value: string): boolean => MOBILE_PATTERN.test(value.replace(/[\s-]/g, ""));

/**
 * The display form that never shows the full number: "0917 ••• 2288". This is
 * the same shape the saved-recipient chips already render for mobile-keyed
 * wallets, so the send screen and the review both show one consistent handle.
 */
export const maskMobileNumber = (value: string): string => {
  const digits = value.replace(/[\s-]/g, "");
  return `${digits.slice(0, 4)} ••• ${digits.slice(-4)}`;
};

/** Inline message for a value that failed `isValidMobileNumber`. */
export const mobileNumberFormatMessage = (): string => "Enter an 11-digit Philippine mobile number starting with 09.";

/**
 * The display form stored on the profile: "09175552288" → "+63 917 555 2288",
 * matching the `MOCK_USER.mobile` format the rest of the app renders. Falls
 * back to the input when it is not a national-format number.
 */
export const formatMobileDisplay = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!/^09\d{9}$/.test(digits)) return value;
  return `+63 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
};
