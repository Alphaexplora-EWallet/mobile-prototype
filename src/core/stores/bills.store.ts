import { create } from "zustand";
import type { AutopayEnrollment } from "../domain/payments";
import type { Money } from "../money/money";
import { MOCK_AUTOPAY } from "../data/mock/payments.mock";

export const INITIAL_BILLS = {
  /** Which biller the entry screen is composing a payment for. */
  billerId: null as string | null,
  accountNumber: "",
  amount: "",
  /** Filled by `directory.validateBillAccount`. Null until it answers. */
  accountName: null as string | null,
  amountDue: null as Money | null,
  enrollments: MOCK_AUTOPAY as readonly AutopayEnrollment[],
  selectedEnrollment: null as string | null,
};

type BillsState = typeof INITIAL_BILLS & {
  actions: {
    startBill(billerId: string): void;
    setAccountNumber(value: string): void;
    setAmount(value: string): void;
    setValidation(accountName: string | null, amountDue: Money | null): void;
    selectEnrollment(id: string): void;
    setEnrollmentStatus(id: string, status: AutopayEnrollment["status"]): void;
    cancelEnrollment(id: string): void;
    reset(): void;
  };
};

/**
 * Bill drafts and autopay enrollments. Autopay lives in a store rather than
 * being read straight from the fixture because pausing one has to stick across a
 * tab switch — a paused schedule that resumes itself is worse than no control.
 */
export const useBillsStore = create<BillsState>()((set, get) => ({
  ...INITIAL_BILLS,
  actions: {
    startBill: (billerId) => set({ billerId, accountNumber: "", amount: "", accountName: null, amountDue: null }),
    setAccountNumber: (accountNumber) => {
      if (get().accountNumber === accountNumber) return;
      // A different account invalidates the name that belonged to the old one.
      set({ accountNumber, accountName: null, amountDue: null });
    },
    setAmount: (amount) => set({ amount }),
    setValidation: (accountName, amountDue) => set({ accountName, amountDue }),
    selectEnrollment: (selectedEnrollment) => set({ selectedEnrollment }),
    setEnrollmentStatus: (id, status) =>
      set((state) => ({
        enrollments: state.enrollments.map((entry) => (entry.id === id ? { ...entry, status } : entry)),
      })),
    cancelEnrollment: (id) => set((state) => ({ enrollments: state.enrollments.filter((entry) => entry.id !== id) })),
    reset: () => set(INITIAL_BILLS),
  },
}));

export const billsActions = useBillsStore.getState().actions;
