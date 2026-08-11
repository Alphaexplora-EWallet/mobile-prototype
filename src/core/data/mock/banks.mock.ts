import type { Bank, TransferRail } from "../../domain/rails";
import { FINA_BANK_CODE } from "../../domain/rails";
import { type Money, pesos } from "../../money/money";

/**
 * The provider's bank directory. In production this comes from the adapter at
 * runtime — a real institution list goes stale — which is why `BankCode` is a
 * string and not a union.
 *
 * Rail support is not uniform: e-wallets settle over InstaPay only, while
 * universal banks take both.
 */
export const MOCK_BANKS: readonly Bank[] = [
  { code: FINA_BANK_CODE, name: "FIN-A Wallet", shortName: "FIN-A", rails: ["internal"] },
  { code: "BDO", name: "BDO Unibank", shortName: "BDO", rails: ["instapay", "pesonet"] },
  { code: "BPI", name: "Bank of the Philippine Islands", shortName: "BPI", rails: ["instapay", "pesonet"] },
  { code: "MBTC", name: "Metrobank", shortName: "Metrobank", rails: ["instapay", "pesonet"] },
  { code: "LBP", name: "Land Bank of the Philippines", shortName: "Landbank", rails: ["instapay", "pesonet"] },
  { code: "UBP", name: "UnionBank of the Philippines", shortName: "UnionBank", rails: ["instapay", "pesonet"] },
  { code: "GCASH", name: "GCash", shortName: "GCash", rails: ["instapay"] },
  { code: "SEAB", name: "SeaBank Philippines", shortName: "SeaBank", rails: ["instapay"] },
];

export const findBank = (code: string): Bank | null => MOCK_BANKS.find((bank) => bank.code === code) ?? null;

export type RailPricing = {
  fee: Money;
  /** Null when the cap is set by the beneficiary bank rather than the rail. */
  perTransaction: Money | null;
  arrivalLabel: string;
  cutoffLabel?: string;
};

/**
 * What each rail costs and promises. Real figures: InstaPay is capped at
 * ₱50,000 per transaction and clears in real time; PESONet batches and credits
 * within the same banking day, so it has a cut-off.
 */
export const RAIL_PRICING: Readonly<Record<TransferRail, RailPricing>> = {
  internal: {
    fee: pesos(0),
    perTransaction: null,
    arrivalLabel: "Arrives instantly to FIN-A wallets",
  },
  instapay: {
    fee: pesos(15),
    perTransaction: pesos(50_000),
    arrivalLabel: "Arrives in seconds over InstaPay",
  },
  pesonet: {
    fee: pesos(25),
    perTransaction: null,
    arrivalLabel: "Credited within the same banking day",
    cutoffLabel: "Sent before 3:00 PM credits today, otherwise the next banking day",
  },
};
