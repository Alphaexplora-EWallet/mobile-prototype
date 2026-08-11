import type { KycStatus, KycTier, RailLimit, TierLimits } from "../../domain/compliance";
import type { Statement, StatementRow } from "../../domain/statement";
import { buildStatement } from "../../domain/statement";
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

/**
 * Monthly statements, each built from dated rows so the closing balance and
 * transaction count are *derived*, never hand-maintained — a statement whose
 * rows do not add up would be a bug, not a fixture choice. The counterparties
 * mirror the activity fixtures (Daily Brew, FreshMart, Meralco, Converge, QR
 * merchants, transfers) so the export reads like the same wallet's history.
 *
 * April 2026 is deliberately empty: the wallet existed but nothing moved, and
 * the export must show an empty-file state instead of crashing or emitting a
 * corrupt artifact.
 */
const rows = (
  entries: readonly [date: string, description: string, reference: string, amount: number][],
): readonly StatementRow[] =>
  entries.map(([date, description, reference, amount]) => ({ date, description, reference, amount: pesos(amount) }));

export const MOCK_STATEMENTS: readonly Statement[] = [
  buildStatement({
    id: "2026-07",
    periodLabel: "July 2026",
    generatedLabel: "Generated Aug 1, 2026",
    openingBalance: pesos(21_940.25),
    rows: rows([
      ["Jul 2, 2026", "Funds received — salary", "NBK-2026-0701", 15_000],
      ["Jul 3, 2026", "Sent to Jomar D.", "NBK-2026-0702", -1_250],
      ["Jul 5, 2026", "Meralco account 0412887301", "NBK-2026-0703", -2_340],
      ["Jul 7, 2026", "QR PH payment to Kape't Tambay", "NBK-2026-0704", -415],
      ["Jul 9, 2026", "Daily Brew", "NBK-2026-0705", -160],
      ["Jul 12, 2026", "Cash in through 7-Eleven", "NBK-2026-0706", 1_000],
      ["Jul 14, 2026", "FreshMart", "NBK-2026-0707", -845.75],
      ["Jul 16, 2026", "InstaPay transfer to BPI", "NBK-2026-0708", -2_950],
      ["Jul 18, 2026", "Sent to Mira S.", "NBK-2026-0709", -600],
      ["Jul 21, 2026", "Converge account 8830012245", "NBK-2026-0710", -1_699],
      ["Jul 23, 2026", "PESONet transfer to Land Bank", "NBK-2026-0711", -5_000],
      ["Jul 25, 2026", "Money received", "NBK-2026-0712", 2_000],
    ]),
  }),
  buildStatement({
    id: "2026-06",
    periodLabel: "June 2026",
    generatedLabel: "Generated Jul 1, 2026",
    openingBalance: pesos(18_215),
    rows: rows([
      ["Jun 3, 2026", "Funds received — salary", "NBK-2026-0601", 18_000],
      ["Jun 5, 2026", "Meralco account 0412887301", "NBK-2026-0602", -2_340],
      ["Jun 7, 2026", "QR PH payment to Mang Larry's", "NBK-2026-0603", -520],
      ["Jun 9, 2026", "Daily Brew", "NBK-2026-0604", -160],
      ["Jun 11, 2026", "FreshMart", "NBK-2026-0605", -1_245.75],
      ["Jun 14, 2026", "Sent to Jomar D.", "NBK-2026-0606", -2_000],
      ["Jun 16, 2026", "Daily Brew", "NBK-2026-0607", -160],
      ["Jun 18, 2026", "InstaPay transfer to BPI", "NBK-2026-0608", -2_500],
      ["Jun 21, 2026", "Converge account 8830012245", "NBK-2026-0609", -1_699],
      ["Jun 23, 2026", "PESONet transfer to Land Bank", "NBK-2026-0610", -3_500],
      ["Jun 26, 2026", "ATM withdrawal", "NBK-2026-0611", -2_150],
      ["Jun 28, 2026", "Money received", "NBK-2026-0612", 2_000],
    ]),
  }),
  buildStatement({
    id: "2026-05",
    periodLabel: "May 2026",
    generatedLabel: "Generated Jun 1, 2026",
    openingBalance: pesos(16_002.75),
    rows: rows([
      ["May 4, 2026", "Funds received — salary", "NBK-2026-0501", 16_000],
      ["May 6, 2026", "Meralco account 0412887301", "NBK-2026-0502", -2_340],
      ["May 8, 2026", "QR PH payment to Karenderia ni Aling Nena", "NBK-2026-0503", -380],
      ["May 10, 2026", "Daily Brew", "NBK-2026-0504", -160],
      ["May 12, 2026", "FreshMart", "NBK-2026-0505", -1_675.75],
      ["May 15, 2026", "Sent to Mira S.", "NBK-2026-0506", -900],
      ["May 16, 2026", "Sent to Jomar D.", "NBK-2026-0507", -1_500],
      ["May 18, 2026", "Daily Brew", "NBK-2026-0508", -160],
      ["May 20, 2026", "InstaPay transfer to BPI", "NBK-2026-0509", -3_250],
      ["May 22, 2026", "Cash in through 7-Eleven", "NBK-2026-0510", 1_500],
      ["May 25, 2026", "Converge account 8830012245", "NBK-2026-0511", -1_699],
      ["May 27, 2026", "PESONet transfer to Land Bank", "NBK-2026-0512", -2_000],
      ["May 29, 2026", "ATM withdrawal", "NBK-2026-0513", -2_223],
      ["May 30, 2026", "Money received", "NBK-2026-0514", 1_000],
    ]),
  }),
  buildStatement({
    id: "2026-04",
    periodLabel: "April 2026",
    generatedLabel: "Generated May 1, 2026",
    openingBalance: pesos(16_002.75),
    rows: rows([]),
  }),
];
