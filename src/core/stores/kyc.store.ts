import { create } from "zustand";
import type { IdDocumentType, KycSubmission } from "../domain/compliance";

/** The capture flow's steps, in order. The index is what the store holds. */
export const KYC_STEPS = ["document", "front", "back", "selfie", "address"] as const;
export type KycStep = (typeof KYC_STEPS)[number];

/**
 * Why a submission was turned down and where, so a resubmit can restart at the
 * failed step instead of making the user repeat the whole flow.
 */
export type KycRejection = {
  /** From the compliance layer, not a real KYC/AML verdict. */
  reason: string;
  /** The capture step that failed review; resubmission restarts here. */
  stepIndex: number;
};

export const INITIAL_KYC_DRAFT: KycSubmission = {
  documentType: "philsys",
  frontCaptured: false,
  backCaptured: false,
  selfieCaptured: false,
  addressLine: "",
  city: "",
  postalCode: "",
};

export const INITIAL_KYC = {
  stepIndex: 0,
  draft: INITIAL_KYC_DRAFT,
  /** Set while the user is resubmitting after a rejection. */
  rejection: null as KycRejection | null,
};

type KycState = typeof INITIAL_KYC & {
  actions: {
    goToStep(index: number): void;
    next(): void;
    previous(): void;
    setDocumentType(type: IdDocumentType): void;
    capture(field: "frontCaptured" | "backCaptured" | "selfieCaptured"): void;
    setAddress(field: "addressLine" | "city" | "postalCode", value: string): void;
    /**
     * Restarts capture at the step that failed review. Earlier steps' data is
     * kept; the failed step's own artifact is cleared so it must be re-done.
     */
    resumeFromRejection(rejection: KycRejection): void;
    reset(): void;
  };
};

/** Drops the rejected artifact for a step, leaving the rest of the draft alone. */
const clearFailedStep = (draft: KycSubmission, step: KycStep): KycSubmission => {
  switch (step) {
    case "document":
      return draft;
    case "front":
      return { ...draft, frontCaptured: false };
    case "back":
      return { ...draft, backCaptured: false };
    case "selfie":
      return { ...draft, selfieCaptured: false };
    case "address":
      return { ...draft, addressLine: "", city: "", postalCode: "" };
  }
};

/**
 * Builds the draft for a resubmission. Steps before the failed one already
 * passed review, so their captures are kept complete; the failed step's own
 * artifact is cleared so it must be re-done.
 */
const resumeDraft = (draft: KycSubmission, failedStepIndex: number): KycSubmission => {
  let next = clearFailedStep(draft, KYC_STEPS[failedStepIndex]);
  for (let index = 0; index < failedStepIndex; index += 1) {
    switch (KYC_STEPS[index]) {
      case "front":
        next = { ...next, frontCaptured: true };
        break;
      case "back":
        next = { ...next, backCaptured: true };
        break;
      case "selfie":
        next = { ...next, selfieCaptured: true };
        break;
      default:
        break;
    }
  }
  return next;
};

/**
 * Verification progress. In a store rather than route params for the reason the
 * quest's limit-setup step is: a half-finished capture has to survive a tab
 * switch, and starting over because someone checked a notification is hostile.
 */
export const useKycStore = create<KycState>()((set, get) => ({
  ...INITIAL_KYC,
  actions: {
    goToStep: (stepIndex) => {
      const clamped = Math.max(0, Math.min(KYC_STEPS.length - 1, stepIndex));
      if (get().stepIndex === clamped) return;
      set({ stepIndex: clamped });
    },
    next: () => set((state) => ({ stepIndex: Math.min(KYC_STEPS.length - 1, state.stepIndex + 1) })),
    previous: () => set((state) => ({ stepIndex: Math.max(0, state.stepIndex - 1) })),
    setDocumentType: (documentType) => set((state) => ({ draft: { ...state.draft, documentType } })),
    capture: (field) => set((state) => ({ draft: { ...state.draft, [field]: true } })),
    setAddress: (field, value) => set((state) => ({ draft: { ...state.draft, [field]: value } })),
    resumeFromRejection: (rejection) => {
      const clamped = Math.max(0, Math.min(KYC_STEPS.length - 1, rejection.stepIndex));
      set((state) => ({
        stepIndex: clamped,
        // Persist the clamped index so the marker can never diverge from the position.
        rejection: { ...rejection, stepIndex: clamped },
        draft: resumeDraft(state.draft, clamped),
      }));
    },
    reset: () => set(INITIAL_KYC),
  },
}));

export const kycActions = useKycStore.getState().actions;
