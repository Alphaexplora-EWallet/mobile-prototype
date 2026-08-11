import type { TransferRail } from "./rails";
import type { Money } from "../money/money";

/**
 * Customer due diligence, which a BaaS provider requires and this prototype had
 * no vocabulary for. Tiers gate limits, so `limits` and `kycStatus` are two
 * views of the same fact.
 */
export type KycTier = "basic" | "verified" | "full";

export const KYC_TIER_ORDER: readonly KycTier[] = ["basic", "verified", "full"];

export type KycTierInfo = {
  tier: KycTier;
  name: string;
  requirement: string;
  unlocks: readonly string[];
};

export const KYC_TIERS: Readonly<Record<KycTier, KycTierInfo>> = {
  basic: {
    tier: "basic",
    name: "Basic",
    requirement: "Name and mobile number only",
    unlocks: ["Receive money", "Pay bills", "Send to FIN-A wallets"],
  },
  verified: {
    tier: "verified",
    name: "Verified",
    requirement: "One valid government ID and a selfie",
    unlocks: ["Send to any bank over InstaPay", "Higher daily limits", "Cash in over the counter"],
  },
  full: {
    tier: "full",
    name: "Fully verified",
    requirement: "ID, selfie, and a confirmed home address",
    unlocks: ["PESONet transfers", "Highest daily and monthly limits", "Monthly statements"],
  },
};

export const nextKycTier = (tier: KycTier): KycTier | null => KYC_TIER_ORDER[KYC_TIER_ORDER.indexOf(tier) + 1] ?? null;

export type KycSubmissionState = "not-started" | "in-review" | "approved" | "rejected";

export type KycStatus = {
  tier: KycTier;
  state: KycSubmissionState;
  submittedLabel?: string;
  /** Why a submission was rejected, or what review is waiting on. */
  reviewNote?: string;
  /**
   * Which capture step failed review, so a resubmit can restart there instead
   * of from the top. Index into the capture flow's step list; present when
   * `state === "rejected"`.
   */
  rejectedStepIndex?: number;
};

export type IdDocumentType = "philsys" | "passport" | "drivers-license" | "umid";

export type IdDocumentInfo = { type: IdDocumentType; name: string; detail: string };

export const ID_DOCUMENTS: readonly IdDocumentInfo[] = [
  { type: "philsys", name: "PhilSys National ID", detail: "Front and back" },
  { type: "passport", name: "Philippine passport", detail: "Photo page only" },
  { type: "drivers-license", name: "Driver's licence", detail: "Front and back" },
  { type: "umid", name: "UMID", detail: "Front and back" },
];

/**
 * A capture-flow submission. Booleans rather than image data on purpose: the
 * camera sits behind a port that this prototype does not implement, so the flow
 * models that a step was completed, not what it produced.
 */
export type KycSubmission = {
  documentType: IdDocumentType;
  frontCaptured: boolean;
  backCaptured: boolean;
  selfieCaptured: boolean;
  addressLine: string;
  city: string;
  postalCode: string;
};

export type RailLimit = {
  rail: TransferRail;
  /** Null when the rail has no per-transaction cap (PESONet is bank-set). */
  perTransaction: Money | null;
  daily: Money;
  monthly: Money;
  usedToday: Money;
  fee: Money;
  /** False when the current tier cannot use this rail at all. */
  available: boolean;
};

export type TierLimits = {
  tier: KycTier;
  rails: readonly RailLimit[];
};

export type Statement = {
  id: string;
  periodLabel: string;
  generatedLabel: string;
  openingBalance: Money;
  closingBalance: Money;
  transactionCount: number;
};
