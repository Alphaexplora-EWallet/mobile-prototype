import { useEffect, useState } from "react";
import type { KycStatus, TierLimits } from "../domain/compliance";
import type { Statement } from "../domain/statement";
import { ID_DOCUMENTS, KYC_TIERS, nextKycTier } from "../domain/compliance";
import { railName } from "../domain/rails";
import { formatMoney } from "../money/format";
import { subtractMoney } from "../money/money";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { KYC_STEPS, kycActions, useKycStore } from "../stores/kyc.store";
import { statementActions } from "../stores/statement.store";

export function useKycStatusViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void gateway.compliance.kycStatus().then((result) => {
      if (!active) return;
      if (result.ok) setStatus(result.value);
      else setError(result.error.message);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  const current = status ? KYC_TIERS[status.tier] : null;
  const upcoming = status ? nextKycTier(status.tier) : null;

  return {
    title: "Verification",
    isLoading,
    error,
    tierName: current?.name ?? "",
    tierRequirement: current?.requirement ?? "",
    stateLabel: status?.submittedLabel ?? "",
    unlocked: current?.unlocks ?? [],
    /** Null once fully verified — there is nothing left to ask for. */
    nextTier: upcoming
      ? {
          name: KYC_TIERS[upcoming].name,
          requirement: KYC_TIERS[upcoming].requirement,
          unlocks: KYC_TIERS[upcoming].unlocks,
        }
      : null,
    startVerification: () => {
      kycActions.reset();
      navigation.navigate("kyc-capture");
    },
    back: navigation.goBack,
  };
}

/**
 * The capture flow. Steps record that something was captured rather than what:
 * the camera sits behind a port this prototype does not implement, so pretending
 * to hold an image would be the dishonest part, not the missing bytes.
 */
export function useKycCaptureViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const stepIndex = useKycStore((state) => state.stepIndex);
  const draft = useKycStore((state) => state.draft);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = KYC_STEPS[stepIndex];
  const document = ID_DOCUMENTS.find((entry) => entry.type === draft.documentType) ?? ID_DOCUMENTS[0];
  /** The passport has one page, so its back step is skipped. */
  const needsBack = draft.documentType !== "passport";

  const stepDone = (() => {
    switch (step) {
      case "document":
        return true;
      case "front":
        return draft.frontCaptured;
      case "back":
        return !needsBack || draft.backCaptured;
      case "selfie":
        return draft.selfieCaptured;
      case "address":
        return draft.addressLine.trim().length > 0 && draft.city.trim().length > 0;
    }
  })();

  const isLast = stepIndex === KYC_STEPS.length - 1;

  return {
    title: "Verify your identity",
    stepLabel: `Step ${stepIndex + 1} of ${KYC_STEPS.length}`,
    progressPercent: Math.round(((stepIndex + 1) / KYC_STEPS.length) * 100),
    step,
    documents: ID_DOCUMENTS.map((entry) => ({
      id: entry.type,
      title: entry.name,
      detail: entry.detail,
      selected: entry.type === draft.documentType,
    })),
    selectDocument: (id: string) => kycActions.setDocumentType(id as typeof draft.documentType),
    documentName: document.name,
    needsBack,
    captured: {
      front: draft.frontCaptured,
      back: draft.backCaptured,
      selfie: draft.selfieCaptured,
    },
    capture: kycActions.capture,
    address: { line: draft.addressLine, city: draft.city, postalCode: draft.postalCode },
    setAddress: kycActions.setAddress,
    canAdvance: stepDone && !isSubmitting,
    isLast,
    isSubmitting,
    error,
    advance: async () => {
      if (!stepDone) return;
      if (!isLast) {
        // Skip the back-of-card step for a single-page document.
        kycActions.goToStep(step === "front" && !needsBack ? stepIndex + 2 : stepIndex + 1);
        return;
      }
      setIsSubmitting(true);
      setError(null);
      const result = await gateway.compliance.submitKyc(draft);
      setIsSubmitting(false);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      kycActions.reset();
      navigation.navigate("kyc-status");
    },
    previous: () => (stepIndex === 0 ? navigation.goBack() : kycActions.previous()),
    back: navigation.goBack,
  };
}

export function useLimitsViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const [limits, setLimits] = useState<TierLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void gateway.compliance.limits().then((result) => {
      if (!active) return;
      if (result.ok) setLimits(result.value);
      else setError(result.error.message);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  return {
    title: "Limits and fees",
    isLoading,
    error,
    tierName: limits ? KYC_TIERS[limits.tier].name : "",
    rails: (limits?.rails ?? []).map((rail) => ({
      id: rail.rail,
      name: railName(rail.rail),
      available: rail.available,
      feeLabel: rail.fee.amount === 0 ? "No fee" : formatMoney(rail.fee),
      perTransactionLabel: rail.perTransaction ? formatMoney(rail.perTransaction) : "Set by the receiving bank",
      dailyLabel: formatMoney(rail.daily),
      monthlyLabel: formatMoney(rail.monthly),
      remainingLabel: formatMoney(subtractMoney(rail.daily, rail.usedToday)),
      /** Percentage of today's allowance already used, for the bar. */
      usedPercent: rail.daily.amount === 0 ? 0 : Math.round((rail.usedToday.amount / rail.daily.amount) * 100),
    })),
    back: navigation.goBack,
  };
}

export function useStatementsViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const [statements, setStatements] = useState<readonly Statement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void gateway.accounts.statements().then((result) => {
      if (!active) return;
      if (result.ok) setStatements(result.value);
      else setError(result.error.message);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  return {
    title: "Statements",
    isLoading,
    error,
    /** Gated behind full verification, so offer the way out of that. */
    verifyPrompt: error ? () => navigation.navigate("kyc-status") : null,
    items: statements.map((statement) => ({
      id: statement.id,
      title: statement.periodLabel,
      detail: `${statement.transactionCount} transactions · ${statement.generatedLabel}`,
      closingLabel: formatMoney(statement.closingBalance),
    })),
    /** Each month opens the real month view, where the export lives. */
    openStatement: (id: string) => {
      statementActions.selectStatement(id);
      navigation.navigate("statement-month");
    },
    back: navigation.goBack,
  };
}
