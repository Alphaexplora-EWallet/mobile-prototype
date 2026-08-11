import { create } from "zustand";
import type { MoneyRequest } from "../domain/request";
import type { Recipient } from "../domain/payments";
import type { Money } from "../money/money";

export const INITIAL_REQUESTS = {
  /** Which saved recipient the entry screen is composing a request for. */
  recipientId: null as string | null,
  amount: "",
  note: "",
  /**
   * Created requests, newest first. Client-side state, not bank activity: a
   * request moves no money, so the banking gateway has nothing to know about
   * until acceptance executes a payment through the shared pipeline.
   */
  requests: [] as readonly MoneyRequest[],
};

type RequestsState = typeof INITIAL_REQUESTS & {
  actions: {
    startRequest(recipientId: string): void;
    setAmount(value: string): void;
    setNote(value: string): void;
    /** Appends the request and clears the draft. Returns the new request's id. */
    createRequest(payer: Recipient, amount: Money, note: string): string;
    /** Only a pending request can be resolved; re-accepting is a no-op. */
    markAccepted(id: string): void;
    markRejected(id: string): void;
    reset(): void;
  };
};

/** Module-scoped so ids stay unique even after a test resets the store. */
let requestCounter = 0;

/**
 * The request-money draft plus the outstanding (and resolved) requests. The
 * draft lives in a store for the same reason every other money screen backs
 * its draft with one: a half-written request has to survive a tab switch.
 */
export const useRequestsStore = create<RequestsState>()((set, get) => ({
  ...INITIAL_REQUESTS,
  actions: {
    startRequest: (recipientId) => {
      if (get().recipientId === recipientId) return;
      // A different payer means a different request, so the old draft is gone.
      set({ recipientId, amount: "", note: "" });
    },
    setAmount: (amount) => {
      if (get().amount === amount) return;
      set({ amount });
    },
    setNote: (note) => {
      if (get().note === note) return;
      set({ note });
    },
    createRequest: (payer, amount, note) => {
      requestCounter += 1;
      const id = `req-${String(requestCounter).padStart(4, "0")}`;
      const request: MoneyRequest = {
        id,
        payer,
        amount,
        note: note.trim(),
        status: "pending",
        when: "Just now",
      };
      set((state) => ({
        requests: [request, ...state.requests],
        recipientId: null,
        amount: "",
        note: "",
      }));
      return id;
    },
    markAccepted: (id) =>
      set((state) => ({
        requests: state.requests.map((request) =>
          request.id === id && request.status === "pending" ? { ...request, status: "accepted" } : request,
        ),
      })),
    markRejected: (id) =>
      set((state) => ({
        requests: state.requests.map((request) =>
          request.id === id && request.status === "pending" ? { ...request, status: "rejected" } : request,
        ),
      })),
    reset: () => set(INITIAL_REQUESTS),
  },
}));

export const requestsActions = useRequestsStore.getState().actions;
