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
