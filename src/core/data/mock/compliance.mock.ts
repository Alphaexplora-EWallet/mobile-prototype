import type { KycStatus, KycTier, RailLimit, Statement, TierLimits } from "../../domain/compliance";
import { pesos } from "../../money/money";

/**
 * The wallet starts *verified*, not fully verified — deliberately. It makes the
 * KYC flow reachable from a state that matters (PESONet is gated behind the
 * `full` tier), and it makes `kyc-required` a failure the prototype can actually
 * demonstrate rather than a code no path returns.
 */
export const INITIAL_KYC_STATUS: KycStatus = {
  tier: "verified",
  state: "approved",
  submittedLabel: "Approved Jul 2, 2026",
};

const railLimits = (tier: KycTier): readonly RailLimit[] => [
  {
    rail: "internal",
    perTransaction: null,
    daily: tier === "basic" ? pesos(10_000) : pesos(100_000),
    monthly: tier === "basic" ? pesos(50_000) : pesos(500_000),
    usedToday: pesos(1_240),
    fee: pesos(0),
    available: true,
  },
  {
    rail: "instapay",
    perTransaction: pesos(50_000),
    daily: tier === "full" ? pesos(100_000) : pesos(50_000),
    monthly: tier === "full" ? pesos(500_000) : pesos(200_000),
    usedToday: pesos(2_500),
    fee: pesos(15),
    available: tier !== "basic",
  },
  {
    rail: "pesonet",
    perTransaction: null,
    daily: pesos(200_000),
    monthly: pesos(1_000_000),
    usedToday: pesos(0),
    fee: pesos(25),
    available: tier === "full",
  },
];

export const limitsForTier = (tier: KycTier): TierLimits => ({ tier, rails: railLimits(tier) });

export const MOCK_STATEMENTS: readonly Statement[] = [
  {
    id: "2026-07",
    periodLabel: "July 2026",
    generatedLabel: "Generated Aug 1, 2026",
    openingBalance: pesos(21_940.25),
    closingBalance: pesos(24_680.5),
    transactionCount: 34,
  },
  {
    id: "2026-06",
    periodLabel: "June 2026",
    generatedLabel: "Generated Jul 1, 2026",
    openingBalance: pesos(18_215),
    closingBalance: pesos(21_940.25),
    transactionCount: 41,
  },
  {
    id: "2026-05",
    periodLabel: "May 2026",
    generatedLabel: "Generated Jun 1, 2026",
    openingBalance: pesos(16_002.75),
    closingBalance: pesos(18_215),
    transactionCount: 28,
  },
];
