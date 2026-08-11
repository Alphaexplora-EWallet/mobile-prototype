import { create } from "zustand";
import { MOCK_DEPOSIT_METHODS } from "../data/mock/payments.mock";

export const INITIAL_DEPOSIT_DRAFT = {
  amount: "",
  selectedMethod: MOCK_DEPOSIT_METHODS[0].id,
};

type DepositState = typeof INITIAL_DEPOSIT_DRAFT & {
  actions: {
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
    setAmount: (amount) => set({ amount }),
    selectMethod: (selectedMethod) => {
      if (get().selectedMethod === selectedMethod) return;
      set({ selectedMethod });
    },
    reset: () => set(INITIAL_DEPOSIT_DRAFT),
  },
}));

export const depositActions = useDepositStore.getState().actions;
