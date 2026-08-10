import { create } from "zustand";
import { INITIAL_SCREEN, isTabScreen, type Screen, type TabScreen } from "./screens";

export type NavigationState = {
  /** A real stack, so "back" returns where the user came from. */
  stack: readonly Screen[];
  actions: {
    navigate(screen: Screen): void;
    goBack(): void;
    switchTab(tab: TabScreen): void;
    resetTo(screen: Screen): void;
  };
};

const top = (stack: readonly Screen[]) => stack[stack.length - 1];

export const useNavigationStore = create<NavigationState>()((set, get) => ({
  stack: [INITIAL_SCREEN],
  actions: {
    navigate: (screen) => {
      const { stack } = get();
      if (top(stack) === screen) return;
      // Tabs are roots, not stack entries: switching tabs starts a new stack.
      set({ stack: isTabScreen(screen) ? [screen] : [...stack, screen] });
    },
    goBack: () => set(({ stack }) => (stack.length > 1 ? { stack: stack.slice(0, -1) } : { stack })),
    switchTab: (tab) => set({ stack: [tab] }),
    resetTo: (screen) => set({ stack: [screen] }),
  },
}));

export const navigationActions = useNavigationStore.getState().actions;

export const useCurrentScreen = (): Screen => useNavigationStore((state) => state.stack[state.stack.length - 1]);
export const useCanGoBack = (): boolean => useNavigationStore((state) => state.stack.length > 1);
