import { useShallow } from "zustand/react/shallow";
import type { SimulatedResult } from "../domain/simulation";
import type { Screen, TabScreen } from "../navigation/screens";
import { isTabScreen } from "../navigation/screens";
import { useNavigation } from "../navigation/useNavigation";
import { usePreferencesStore } from "../stores/preferences.store";
import { uiActions, useUiStore } from "../stores/ui.store";
import type { Theme } from "@/ui/theme/ThemeContext";

export type AppShellViewModel = {
  theme: Theme;
  screen: Screen;
  /** Present only on tab screens, which is also what decides the tab bar. */
  activeTab: TabScreen | null;
  sheet: SimulatedResult | null;
  selectTab(tab: TabScreen): void;
  dismissSheet(): void;
};

export function useAppShellViewModel(): AppShellViewModel {
  const { screen, switchTab } = useNavigation();
  const theme = usePreferencesStore((state) => state.theme);
  const sheet = useUiStore(useShallow((state) => state.sheet));

  return {
    theme,
    screen,
    activeTab: isTabScreen(screen) ? screen : null,
    sheet,
    selectTab: switchTab,
    dismissSheet: uiActions.dismissSheet,
  };
}
