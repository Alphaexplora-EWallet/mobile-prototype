import { create } from "zustand";
import { MOCK_DEPOSIT_METHODS } from "../data/mock/payments.mock";

export const INITIAL_DEPOSIT_DRAFT = {
  /** Which step of the "Choose a method" / "Amount" wizard is showing. Survives a tab switch. */
  step: 1 as 1 | 2,
  amount: "",
  selectedMethod: MOCK_DEPOSIT_METHODS[0].id,
};

type DepositState = typeof INITIAL_DEPOSIT_DRAFT & {
  actions: {
    nextStep(): void;
    previousStep(): void;
    setAmount(value: string): void;
    selectMethod(id: string): void;
    reset(): void;
  };
};

/**
 * The cash-in draft. It was component state, which was fine while "Add money"
 * only opened a simulated sheet — now that it leads to a review screen, going
 * back would have thrown the amount away.
 */
export const useDepositStore = create<DepositState>()((set, get) => ({
  ...INITIAL_DEPOSIT_DRAFT,
  actions: {
    nextStep: () => set((state) => ({ step: state.step === 1 ? 2 : state.step })),
    previousStep: () => set((state) => ({ step: state.step === 2 ? 1 : state.step })),
    setAmount: (amount) => set({ amount }),
    selectMethod: (selectedMethod) => {
      if (get().selectedMethod === selectedMethod) return;
      set({ selectedMethod });
    },
    reset: () => set(INITIAL_DEPOSIT_DRAFT),
  },
}));

export const depositActions = useDepositStore.getState().actions;
