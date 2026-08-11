import { create } from "zustand";
import type { TransactionKind } from "../domain/banking";

/** The filter chips. `all` is the absence of a filter, not a kind. */
export type ActivityFilter = "all" | "in" | "out" | "bills";

export const ACTIVITY_FILTER_KINDS: Readonly<Record<ActivityFilter, readonly TransactionKind[] | undefined>> = {
  all: undefined,
  in: ["cash-in", "transfer-in", "request-in"],
  out: ["transfer-out", "card-payment"],
  bills: ["bill-payment", "qr-payment"],
};

export const INITIAL_ACTIVITY = {
  selectedTransactionId: null as string | null,
  search: "",
  filter: "all" as ActivityFilter,
};

type ActivityState = typeof INITIAL_ACTIVITY & {
  actions: {
    selectTransaction(id: string): void;
    clearSelection(): void;
    setSearch(value: string): void;
    setFilter(filter: ActivityFilter): void;
  };
};

export const useActivityStore = create<ActivityState>()((set, get) => ({
  ...INITIAL_ACTIVITY,
  actions: {
    selectTransaction: (id) => {
      if (get().selectedTransactionId === id) return;
      set({ selectedTransactionId: id });
    },
    clearSelection: () => set({ selectedTransactionId: null }),
    setSearch: (search) => {
      if (get().search === search) return;
      set({ search });
    },
    setFilter: (filter) => {
      if (get().filter === filter) return;
      set({ filter });
    },
  },
}));

export const activityActions = useActivityStore.getState().actions;
