import { useShallow } from "zustand/react/shallow";
import type { SheetAction, SheetResult } from "../domain/simulation";
import type { Screen, TabScreen } from "../navigation/screens";
import { INITIAL_SCREEN, SIGNED_IN_SCREEN, isAuthScreen, isTabScreen } from "../navigation/screens";
import { useNavigation } from "../navigation/useNavigation";
import { usePreferencesStore } from "../stores/preferences.store";
import { sessionActions, useSessionStore } from "../stores/session.store";
import { uiActions, useUiStore } from "../stores/ui.store";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { resetStores } from "../app/resetStores";
import type { AuthSession, SessionStatus, SessionToken } from "../domain/session";
import type { Theme } from "@/ui/theme/ThemeContext";

export type AppShellViewModel = {
  theme: Theme;
  /** `"unknown"` means storage has not answered yet and the shell shows a splash. */
  status: SessionStatus;
  token: SessionToken | null;
  hydrated(session: AuthSession | null): void;
  screen: Screen;
  /** Present only on tab screens, which is also what decides the tab bar. */
  activeTab: TabScreen | null;
  sheet: SheetResult | null;
  selectTab(tab: TabScreen): void;
  dismissSheet(): void;
  confirmSheet(): void;
};

export function useAppShellViewModel(): AppShellViewModel {
  const { screen: requested, switchTab } = useNavigation();
  const theme = usePreferencesStore((state) => state.theme);
  const sheet = useUiStore(useShallow((state) => state.sheet));
  const gateway = useBankingGateway();
  const status = useSessionStore((state) => state.status);
  const token = useSessionStore((state) => state.token);

  /**
   * The gate, and deliberately a derivation rather than an effect that
   * redirects. An effect would render the wrong screen first and then correct
   * itself, which is a visible flash and an extra render; and writing to the
   * navigation stack from here would fight whatever the screen is doing.
   *
   * So the stack keeps whatever was asked for and this decides what is *shown*.
   * A signed-out user only ever sees an auth screen; a signed-in one never does.
   */
  const screen: Screen =
    status === "signed-in"
      ? isAuthScreen(requested)
        ? SIGNED_IN_SCREEN
        : requested
      : isAuthScreen(requested)
        ? requested
        : INITIAL_SCREEN;

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
        void gateway.auth.signOut();
        resetStores();
        /**
         * `resetStores` leaves the status at `unknown`, which would send the
         * shell back to the splash and let the bridge re-read the token it is
         * about to delete. Saying `signed-out` here is what makes signing out
         * final, and the bridge clears storage on seeing it.
         */
        sessionActions.signedOut();
        return;
    }
  };

  return {
    theme,
    status,
    token,
    hydrated: sessionActions.hydrated,
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
