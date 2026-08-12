import { useShallow } from "zustand/react/shallow";
import type { SheetAction, SheetResult } from "../domain/simulation";
import type { Screen, TabScreen } from "../navigation/screens";
import { isTabScreen } from "../navigation/screens";
import { useNavigation } from "../navigation/useNavigation";
import { usePreferencesStore } from "../stores/preferences.store";
import { uiActions, useUiStore } from "../stores/ui.store";
import { resetStores } from "../app/resetStores";
import type { Theme } from "@/ui/theme/ThemeContext";

export type AppShellViewModel = {
  theme: Theme;
  screen: Screen;
  /** Present only on tab screens, which is also what decides the tab bar. */
  activeTab: TabScreen | null;
  sheet: SheetResult | null;
  selectTab(tab: TabScreen): void;
  dismissSheet(): void;
  confirmSheet(): void;
};

export function useAppShellViewModel(): AppShellViewModel {
  const { screen, switchTab } = useNavigation();
  const theme = usePreferencesStore((state) => state.theme);
  const sheet = useUiStore(useShallow((state) => state.sheet));

  /**
   * The shell resolves confirmed sheet actions because it is the only place
   * that outlives the screen which asked. Signing out unmounts Profile; a
   * handler owned by Profile's ViewModel would be running inside a component
   * that its own effect had just torn down.
   */
  const runAction = (action: SheetAction) => {
    switch (action) {
      case "sign-out":
        // Order matters. resetStores puts the navigation stack back to Welcome
        // itself, so nothing further is needed — and clearing the sheet first
        // would leave a frame where the signed-out state is still on screen.
        uiActions.dismissSheet();
        resetStores();
        return;
    }
  };

  return {
    theme,
    screen,
    activeTab: isTabScreen(screen) ? screen : null,
    sheet,
    selectTab: switchTab,
    dismissSheet: uiActions.dismissSheet,
    confirmSheet: () => {
      if (sheet?.kind !== "confirm") return;
      runAction(sheet.action);
    },
  };
}
