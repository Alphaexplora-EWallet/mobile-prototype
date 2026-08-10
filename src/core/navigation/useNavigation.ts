import { useMemo } from "react";
import type { Screen, TabScreen } from "./screens";
import { navigationActions, useCanGoBack, useCurrentScreen } from "./navigation.store";

/**
 * The navigation contract, deliberately a subset of React Navigation's
 * useNavigation() with the same method names. Migrating means rewriting this
 * file's body and deleting navigation.store — no ViewModel or view changes.
 */
export type NavigationApi = {
  screen: Screen;
  canGoBack: boolean;
  navigate(screen: Screen): void;
  goBack(): void;
  switchTab(tab: TabScreen): void;
  resetTo(screen: Screen): void;
};

export function useNavigation(): NavigationApi {
  const screen = useCurrentScreen();
  const canGoBack = useCanGoBack();

  return useMemo<NavigationApi>(
    () => ({
      screen,
      canGoBack,
      navigate: navigationActions.navigate,
      goBack: navigationActions.goBack,
      switchTab: navigationActions.switchTab,
      resetTo: navigationActions.resetTo,
    }),
    [screen, canGoBack],
  );
}
