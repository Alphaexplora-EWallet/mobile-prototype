import { create } from "zustand";
import type { IdDocumentType, KycSubmission } from "../domain/compliance";

/** The capture flow's steps, in order. The index is what the store holds. */
export const KYC_STEPS = ["document", "front", "back", "selfie", "address"] as const;
export type KycStep = (typeof KYC_STEPS)[number];

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
};

type KycState = typeof INITIAL_KYC & {
  actions: {
    goToStep(index: number): void;
    next(): void;
    previous(): void;
    setDocumentType(type: IdDocumentType): void;
    capture(field: "frontCaptured" | "backCaptured" | "selfieCaptured"): void;
    setAddress(field: "addressLine" | "city" | "postalCode", value: string): void;
    reset(): void;
  };
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
    reset: () => set(INITIAL_KYC),
  },
}));

export const kycActions = useKycStore.getState().actions;
