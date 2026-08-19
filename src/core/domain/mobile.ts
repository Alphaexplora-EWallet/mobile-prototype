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
 * Folds the shapes a person might type — `+63 917 555 2288`, `63…`, `917…` —
 * into the national form `isValidMobileNumber` accepts.
 *
 * `normalizeMobileNumber` deliberately does not do this: it only strips
 * punctuation, and its output is what an input field shows while being typed.
 * This is the canonical form, used as the account key when signing in or up —
 * one number must not be two accounts because of how it was written.
 */
export const toNationalMobile = (value: string): string => {
  const digits = normalizeMobileNumber(value);
  if (digits.startsWith("63") && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.startsWith("9") && digits.length === 10) return `0${digits}`;
  return digits;
};
