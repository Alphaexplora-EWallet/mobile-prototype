import { create } from "zustand";
import type { Recipient } from "../domain/payments";
import { MOCK_RECIPIENTS } from "../data/mock/payments.mock";

export const INITIAL_RECIPIENTS = {
  saved: MOCK_RECIPIENTS as readonly Recipient[],
};

type RecipientsState = typeof INITIAL_RECIPIENTS & {
  actions: {
    add(recipient: Recipient): void;
    remove(id: string): void;
  };
};

/**
 * Saved recipients. A store rather than the fixture directly, because adding one
 * has to stick: the destination screen can save an account it just verified, and
 * "New recipient" used to be a simulated action sheet with nowhere to put the
 * result.
 */
export const useRecipientsStore = create<RecipientsState>()((set, get) => ({
  ...INITIAL_RECIPIENTS,
  actions: {
    add: (recipient) => {
      if (get().saved.some((existing) => existing.id === recipient.id)) return;
      set((state) => ({ saved: [...state.saved, recipient] }));
    },
    remove: (id) => {
      if (!get().saved.some((existing) => existing.id === id)) return;
      set((state) => ({ saved: state.saved.filter((existing) => existing.id !== id) }));
    },
  },
}));

export const recipientsActions = useRecipientsStore.getState().actions;
