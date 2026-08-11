import { create } from "zustand";
import type { PaymentQuote, PaymentReceipt } from "../domain/banking";
import type { PaymentIntent } from "../domain/paymentIntent";
import type { ConfirmationToken } from "../domain/security";

export const INITIAL_PAYMENT_FLOW = {
  intent: null as PaymentIntent | null,
  quote: null as PaymentQuote | null,
  /**
   * Minted once when the flow starts and reused verbatim on every retry, so a
   * second tap on "Confirm" after a timeout returns the original receipt rather
   * than paying twice. Regenerating it per attempt would defeat the point.
   */
  idempotencyKey: null as string | null,
  confirmation: null as ConfirmationToken | null,
  receipt: null as PaymentReceipt | null,
};

type PaymentState = typeof INITIAL_PAYMENT_FLOW & {
  actions: {
    /** Begins a new payment. Clears any previous quote, token and receipt. */
    start(intent: PaymentIntent, idempotencyKey: string): void;
    setQuote(quote: PaymentQuote | null): void;
    setConfirmation(confirmation: ConfirmationToken): void;
    setReceipt(receipt: PaymentReceipt): void;
    /** Replaces the receipt as it settles, without disturbing the rest. */
    updateReceipt(receipt: PaymentReceipt): void;
    reset(): void;
  };
};

/**
 * The in-flight payment. It lives in a store rather than in route params because
 * a half-finished payment has to survive a tab switch — the same reason the
 * quest's limit-setup step does.
 */
export const usePaymentStore = create<PaymentState>()((set) => ({
  ...INITIAL_PAYMENT_FLOW,
  actions: {
    start: (intent, idempotencyKey) => set({ intent, idempotencyKey, quote: null, confirmation: null, receipt: null }),
    setQuote: (quote) => set({ quote }),
    setConfirmation: (confirmation) => set({ confirmation }),
    setReceipt: (receipt) => set({ receipt }),
    updateReceipt: (receipt) => set({ receipt }),
    reset: () => set(INITIAL_PAYMENT_FLOW),
  },
}));

export const paymentActions = usePaymentStore.getState().actions;
