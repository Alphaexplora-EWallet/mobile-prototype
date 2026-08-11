import { create } from "zustand";
import { MOCK_CASHOUT_ACCOUNTS } from "../data/mock/payments.mock";

export const INITIAL_CASHOUT_DRAFT = {
  amount: "",
  /** The first saved account is preselected, like the first deposit method. */
  selectedAccountId: MOCK_CASHOUT_ACCOUNTS[0]?.id ?? "",
};

type CashOutState = typeof INITIAL_CASHOUT_DRAFT & {
  actions: {
    setAmount(value: string): void;
    selectAccount(id: string): void;
    reset(): void;
  };
};

/**
 * The cash-out draft. It lives in a store (not component state) for the same
 * reason the transfer and deposit drafts do: the amount and chosen account
 * must survive navigating to review and back.
 */
export const useCashOutStore = create<CashOutState>()((set, get) => ({
  ...INITIAL_CASHOUT_DRAFT,
  actions: {
    setAmount: (amount) => set({ amount }),
    selectAccount: (selectedAccountId) => {
      if (get().selectedAccountId === selectedAccountId) return;
      set({ selectedAccountId });
    },
    reset: () => set(INITIAL_CASHOUT_DRAFT),
  },
}));

export const cashOutActions = useCashOutStore.getState().actions;
