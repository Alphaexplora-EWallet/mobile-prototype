/**
 * Rails and the bank directory. Split out of `banking.ts` so that `payments.ts`
 * can give a `Recipient` a `bankCode` without the two files importing each
 * other — `banking.ts` needs `Recipient`, so nothing `Recipient` needs may live
 * there. `banking.ts` re-exports everything here.
 */

/**
 * The Philippine interbank rails. `internal` is not a rail at all — it is a
 * ledger move between two FIN-A wallets — but it sits in the same union because
 * every screen that picks a destination has to choose between them.
 */
export type TransferRail = "internal" | "instapay" | "pesonet";

export type RailInfo = {
  rail: TransferRail;
  name: string;
  detail: string;
  /** PESONet clears in batches, so its receipt is a promise rather than proof. */
  settlesLater: boolean;
};

export const RAIL_INFO: Readonly<Record<TransferRail, RailInfo>> = {
  internal: {
    rail: "internal",
    name: "FIN-A instant",
    detail: "Straight to another FIN-A wallet, any time",
    settlesLater: false,
  },
  instapay: {
    rail: "instapay",
    name: "InstaPay",
    detail: "Real time, 24/7, up to ₱50,000 per transfer",
    settlesLater: false,
  },
  pesonet: {
    rail: "pesonet",
    name: "PESONet",
    detail: "Batched, credited within the same banking day",
    settlesLater: true,
  },
};

export const railName = (rail: TransferRail): string => RAIL_INFO[rail].name;

/**
 * A bank identifier as the adapter knows it. Deliberately a plain string rather
 * than a union: the list comes from the provider directory at runtime, so
 * hardcoding it here would go stale.
 */
export type BankCode = string;

/** The code the app's own wallets answer to, so `internal` has a destination. */
export const FINA_BANK_CODE: BankCode = "FINA";

export type Bank = {
  code: BankCode;
  name: string;
  shortName: string;
  /** Which rails can reach this bank. Not every bank supports both. */
  rails: readonly TransferRail[];
};

/**
 * The rail to use when only one is possible, preferring the cheapest instant
 * option. Returns null when the bank supports none — a directory bug, but the
 * caller has to render something.
 */
export function defaultRailFor(bank: Bank): TransferRail | null {
  const order: readonly TransferRail[] = ["internal", "instapay", "pesonet"];
  return order.find((rail) => bank.rails.includes(rail)) ?? null;
}
