import { create } from "zustand";
import type { SimulatedResult } from "../domain/simulation";
import { simulated } from "../domain/simulation";

export type UiState = {
  /**
   * Was a bare string doing double duty as both the dialog's identity and its
   * title. Now a described result, so a real (confirmed / declined) outcome can
   * join the union without moving any call site.
   */
  sheet: SimulatedResult | null;
  actions: {
    showSimulated(title: string): void;
    dismissSheet(): void;
  };
};

export const useUiStore = create<UiState>()((set) => ({
  sheet: null,
  actions: {
    showSimulated: (title) => set({ sheet: simulated(title) }),
    dismissSheet: () => set({ sheet: null }),
  },
}));

export const uiActions = useUiStore.getState().actions;
