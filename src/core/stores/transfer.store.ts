import { create } from "zustand";
import type { TransferRail } from "../domain/rails";
import { MOCK_RECIPIENTS } from "../data/mock/payments.mock";

export const INITIAL_TRANSFER_DRAFT = {
  /** Which step of the "Send to" / "Amount" wizard is showing. Survives a tab switch. */
  step: 1 as 1 | 2,
  amount: "",
  note: "",
  /** Keyed on `Recipient.id`. It was keyed on `initials`, which is not unique. */
  selectedRecipient: MOCK_RECIPIENTS[0].id,
  /**
   * The "send to a bank account" draft. Kept here beside the amount and note
   * rather than in its own store: it is the same transfer being composed, and
   * splitting it would mean two stores to reset in agreement.
   */
  destinationBankCode: "",
  destinationAccountNumber: "",
  /** Filled by the account name inquiry. Null until the name is confirmed. */
  destinationName: null as string | null,
  destinationRail: null as TransferRail | null,
  saveDestination: false,
  /**
   * The "send to a mobile number" draft — the same transfer, addressed by a
   * FIN-A wallet's phone number instead of a bank account. Amount and note are
   * shared with the bank-account draft above.
   */
  mobileNumber: "",
  /** Filled by the mobile name inquiry. Null until the name is confirmed. */
  mobileName: null as string | null,
};

type TransferState = typeof INITIAL_TRANSFER_DRAFT & {
  actions: {
    nextStep(): void;
    previousStep(): void;
    setAmount(value: string): void;
    setNote(value: string): void;
    selectRecipient(id: string): void;
    /** Changing bank invalidates the verified name — it belonged to the old one. */
    setDestinationBank(bankCode: string, rail: TransferRail | null): void;
    setDestinationAccountNumber(accountNumber: string): void;
    setDestinationName(name: string | null): void;
    setDestinationRail(rail: TransferRail): void;
    setSaveDestination(save: boolean): void;
    resetDestination(): void;
    setMobileNumber(mobileNumber: string): void;
    /** Changing the number invalidates the verified name — it belonged to the old one. */
    setMobileName(name: string | null): void;
    resetMobileDestination(): void;
    reset(): void;
  };
};

export const useTransferStore = create<TransferState>()((set, get) => ({
  ...INITIAL_TRANSFER_DRAFT,
  actions: {
    nextStep: () => set((state) => ({ step: state.step === 1 ? 2 : state.step })),
    previousStep: () => set((state) => ({ step: state.step === 2 ? 1 : state.step })),
    setAmount: (amount) => set({ amount }),
    setNote: (note) => set({ note }),
    selectRecipient: (selectedRecipient) => {
      if (get().selectedRecipient === selectedRecipient) return;
      set({ selectedRecipient });
    },
    setDestinationBank: (destinationBankCode, destinationRail) => {
      if (get().destinationBankCode === destinationBankCode) return;
      set({ destinationBankCode, destinationRail, destinationName: null });
    },
    setDestinationAccountNumber: (destinationAccountNumber) => {
      if (get().destinationAccountNumber === destinationAccountNumber) return;
      set({ destinationAccountNumber, destinationName: null });
    },
    setDestinationName: (destinationName) => set({ destinationName }),
    setDestinationRail: (destinationRail) => set({ destinationRail }),
    setSaveDestination: (saveDestination) => set({ saveDestination }),
    resetDestination: () =>
      set({
        destinationBankCode: "",
        destinationAccountNumber: "",
        destinationName: null,
        destinationRail: null,
        saveDestination: false,
      }),
    setMobileNumber: (mobileNumber) => {
      if (get().mobileNumber === mobileNumber) return;
      set({ mobileNumber, mobileName: null });
    },
    setMobileName: (mobileName) => set({ mobileName }),
    resetMobileDestination: () => set({ mobileNumber: "", mobileName: null }),
    reset: () => set(INITIAL_TRANSFER_DRAFT),
  },
}));

export const transferActions = useTransferStore.getState().actions;
