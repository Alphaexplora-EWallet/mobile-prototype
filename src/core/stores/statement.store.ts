import { create } from "zustand";

/**
 * Which statement month the detail screen shows. Routes carry no params — flow
 * state like this lives in a store so it survives navigation churn (mirrors
 * `activity.store`'s selectedTransactionId).
 */
export const INITIAL_STATEMENT_SELECTION = {
  selectedStatementId: null as string | null,
};

type StatementState = typeof INITIAL_STATEMENT_SELECTION & {
  actions: {
    selectStatement(id: string): void;
  };
};

export const useStatementStore = create<StatementState>()((set, get) => ({
  ...INITIAL_STATEMENT_SELECTION,
  actions: {
    selectStatement: (id) => {
      if (get().selectedStatementId === id) return;
      set({ selectedStatementId: id });
    },
  },
}));

export const statementActions = useStatementStore.getState().actions;
