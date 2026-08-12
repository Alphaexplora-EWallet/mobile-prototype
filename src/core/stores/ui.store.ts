import { create } from "zustand";
import type { ConfirmRequest, SheetResult } from "../domain/simulation";
import { confirmRequest, simulated } from "../domain/simulation";

export type UiState = {
  /**
   * Was a bare string doing double duty as both the dialog's identity and its
   * title. Now a described result, so a real (confirmed / declined) outcome can
   * join the union without moving any call site — which is exactly what the
   * `confirm` variant did.
   */
  sheet: SheetResult | null;
  actions: {
    showSimulated(title: string): void;
    showConfirm(request: Omit<ConfirmRequest, "kind">): void;
    dismissSheet(): void;
  };
};

export const useUiStore = create<UiState>()((set) => ({
  sheet: null,
  actions: {
    showSimulated: (title) => set({ sheet: simulated(title) }),
    showConfirm: (request) => set({ sheet: confirmRequest(request) }),
    dismissSheet: () => set({ sheet: null }),
  },
}));

export const uiActions = useUiStore.getState().actions;
