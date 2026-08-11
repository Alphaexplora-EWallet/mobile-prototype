import { create } from "zustand";

export const INITIAL_BUYLOAD_DRAFT = {
  /** Which operator the entry screen is composing a top-up for. */
  operatorId: null as string | null,
  phoneNumber: "",
  amount: "",
};

type BuyloadState = typeof INITIAL_BUYLOAD_DRAFT & {
  actions: {
    startLoad(operatorId: string): void;
    setPhoneNumber(value: string): void;
    setAmount(value: string): void;
    reset(): void;
  };
};

/**
 * The buy-load draft. It lives in a store (not component state) for the same
 * reason every other money screen backs its draft with one: a half-finished
 * top-up has to survive going back from review.
 */
export const useBuyloadStore = create<BuyloadState>()((set, get) => ({
  ...INITIAL_BUYLOAD_DRAFT,
  actions: {
    startLoad: (operatorId) => {
      if (get().operatorId === operatorId) return;
      // A different operator means a different number, so the old draft is gone.
      set({ operatorId, phoneNumber: "", amount: "" });
    },
    setPhoneNumber: (phoneNumber) => {
      if (get().phoneNumber === phoneNumber) return;
      set({ phoneNumber });
    },
    setAmount: (amount) => {
      if (get().amount === amount) return;
      set({ amount });
    },
    reset: () => set(INITIAL_BUYLOAD_DRAFT),
  },
}));

export const buyloadActions = useBuyloadStore.getState().actions;
