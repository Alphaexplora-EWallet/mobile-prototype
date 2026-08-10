import { CURRENCIES, type Money, money, DEFAULT_CURRENCY, type CurrencyCode } from "./money";

/**
 * U+2212 MINUS SIGN, not the ASCII hyphen. The designs use it, and
 * Intl.NumberFormat cannot produce it.
 */
const MINUS = "−";
const BULLET = "•";

/**
 * Formatting is hand-rolled rather than using Intl.NumberFormat, for three
 * reasons: Intl emits an ASCII hyphen for negatives where this app uses U+2212;
 * its output varies with the host's ICU data, which would make snapshots
 * environment-dependent; and Hermes on React Native ships incomplete Intl
 * unless built with full ICU. One currency and one locale do not justify any
 * of that risk.
 */
export type MoneyFormatOptions = {
  symbol?: boolean;
  grouping?: boolean;
  /** Defaults to the currency's minor units; pass 0 for "₱3,000". */
  fractionDigits?: number;
  sign?: "auto" | "always" | "never";
};

const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export function formatMoney(value: Money, options: MoneyFormatOptions = {}): string {
  const { symbol = true, grouping = true, sign = "auto" } = options;
  const meta = CURRENCIES[value.currency];
  const digits = options.fractionDigits ?? meta.minorUnits;

  const scaled = Math.round(Math.abs(value.amount) / 10 ** (meta.minorUnits - digits));
  const factor = 10 ** digits;
  const whole = Math.trunc(scaled / factor).toString();
  const fraction = digits > 0 ? (scaled % factor).toString().padStart(digits, "0") : "";

  const prefix = sign === "never" ? "" : value.amount < 0 ? MINUS : sign === "always" ? "+" : "";
  const body = grouping ? group(whole) : whole;

  return `${prefix}${symbol ? meta.symbol : ""}${body}${digits > 0 ? `.${fraction}` : ""}`;
}

/** Transaction rows, which show direction explicitly: "+₱2,000.00" / "−₱160.00". */
export const formatSignedMoney = (value: Money, options: MoneyFormatOptions = {}) =>
  formatMoney(value, { ...options, sign: "always" });

/**
 * Masks the formatted string rather than the number, so the hidden value keeps
 * the shape of the real one.
 */
export const maskMoney = (value: Money, options: MoneyFormatOptions = {}) =>
  formatMoney(value, options).replace(/\d/g, BULLET);

/** Parses what a user typed. Returns null while the input is not yet a valid amount. */
export function parseMoneyInput(input: string, currency: CurrencyCode = DEFAULT_CURRENCY): Money | null {
  const meta = CURRENCIES[currency];
  const cleaned = input.replace(/[,\s\u00A0]/g, "").replace(meta.symbol, "");
  if (cleaned === "" || !new RegExp(String.raw`^\d+(\.\d{1,${meta.minorUnits}})?$`).test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  return money(Number(whole) * 10 ** meta.minorUnits + Number(fraction.padEnd(meta.minorUnits, "0")), currency);
}
