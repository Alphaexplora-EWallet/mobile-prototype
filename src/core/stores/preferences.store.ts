import { create } from "zustand";
import type { Theme } from "@/ui/theme/ThemeContext";

export type PreferencesState = {
  theme: Theme;
  /** Sticky across screens: users expect a hidden balance to stay hidden. */
  balanceVisible: boolean;
  actions: {
    setTheme(theme: Theme): void;
    toggleTheme(): void;
    toggleBalanceVisibility(): void;
  };
};

/**
 * No persistence middleware here on purpose. Storage is synchronous on web and
 * asynchronous on device, and the web build additionally needs a DOM write that
 * has no native equivalent. Both live in a bridge (app/bridges/ThemeBridge),
 * which keeps this store identical on both platforms.
 */
export const usePreferencesStore = create<PreferencesState>()((set) => ({
  theme: "light",
  balanceVisible: true,
  actions: {
    setTheme: (theme) => set({ theme }),
    toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
    toggleBalanceVisibility: () => set((state) => ({ balanceVisible: !state.balanceVisible })),
  },
}));

/** Import actions directly; never select them. They are stable, so they add no subscription. */
export const preferencesActions = usePreferencesStore.getState().actions;
