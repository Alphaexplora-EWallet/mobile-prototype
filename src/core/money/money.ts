export type CurrencyCode = "PHP";

export type CurrencyMeta = { code: CurrencyCode; symbol: string; minorUnits: number };

export const CURRENCIES: Readonly<Record<CurrencyCode, CurrencyMeta>> = {
  PHP: { code: "PHP", symbol: "₱", minorUnits: 2 },
};

export const DEFAULT_CURRENCY: CurrencyCode = "PHP";

/**
 * An amount in the currency's minor unit — centavos for PHP — always an
 * integer. Storing money as a float invites rounding drift; storing it as a
 * display string (which this app did) makes arithmetic impossible.
 */
export type Money = { readonly amount: number; readonly currency: CurrencyCode };

export function money(amount: number, currency: CurrencyCode = DEFAULT_CURRENCY): Money {
  if (!Number.isSafeInteger(amount)) {
    throw new TypeError(`Money.amount must be an integer minor unit, received ${amount}`);
  }
  return { amount, currency };
}

/** Authoring helper for fixtures: pesos(24_680.5) is ₱24,680.50. */
export const pesos = (major: number): Money => money(Math.round(major * 100), "PHP");

const assertSameCurrency = (a: Money, b: Money) => {
  if (a.currency !== b.currency) throw new TypeError(`Currency mismatch: ${a.currency} vs ${b.currency}`);
};

export const addMoney = (a: Money, b: Money): Money => (
  assertSameCurrency(a, b),
  money(a.amount + b.amount, a.currency)
);
export const subtractMoney = (a: Money, b: Money): Money => (
  assertSameCurrency(a, b),
  money(a.amount - b.amount, a.currency)
);
export const compareMoney = (a: Money, b: Money): number => (assertSameCurrency(a, b), a.amount - b.amount);
export const isNegative = (value: Money) => value.amount < 0;
export const isZero = (value: Money) => value.amount === 0;

/** Fraction of `whole` that `part` represents, 0 when whole is zero. */
export const ratio = (part: Money, whole: Money): number => (
  assertSameCurrency(part, whole),
  whole.amount === 0 ? 0 : part.amount / whole.amount
);
