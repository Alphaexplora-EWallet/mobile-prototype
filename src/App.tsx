import type { JSX } from "react";

import type { Screen } from "@/core/navigation/screens";
import { preferencesActions } from "@/core/stores/preferences.store";
import { useAppShellViewModel } from "@/core/viewmodels/useAppShellViewModel";

import { ThemeBridge } from "@/app/bridges/ThemeBridge";
import { ThemeProvider } from "@/ui/theme/ThemeContext";
import { StatusBar } from "@/ui/layout/StatusBar";
import { BottomNav } from "@/ui/layout/BottomNav";
import { ActionSheet } from "@/ui/overlays/ActionSheet";
import { WelcomeScreen } from "@/ui/screens/WelcomeScreen";
import { SignInScreen } from "@/ui/screens/SignInScreen";
import { QuizScreen } from "@/ui/screens/QuizScreen";
import { ResultScreen } from "@/ui/screens/ResultScreen";
import { HomeScreen } from "@/ui/screens/HomeScreen";
import { QuestScreen } from "@/ui/screens/QuestScreen";
import { WalletScreen } from "@/ui/screens/WalletScreen";
import { TransferScreen } from "@/ui/screens/TransferScreen";
import { DepositScreen } from "@/ui/screens/DepositScreen";
import { PaymentsScreen } from "@/ui/screens/PaymentsScreen";
import { RewardScreen } from "@/ui/screens/RewardScreen";
import { ProfileScreen } from "@/ui/screens/ProfileScreen";

/**
 * Where a Screen id meets a component, and the only place that mapping lives.
 * Screens take no props: each reads its own ViewModel.
 */
const SCREENS: Record<Screen, () => JSX.Element> = {
  welcome: WelcomeScreen,
  "sign-in": SignInScreen,
  quiz: QuizScreen,
  result: ResultScreen,
  home: HomeScreen,
  wallet: WalletScreen,
  transfer: TransferScreen,
  deposit: DepositScreen,
  payments: PaymentsScreen,
  quest: QuestScreen,
  reward: RewardScreen,
  profile: ProfileScreen,
};

function App() {
  const { theme, screen, activeTab, sheet, selectTab, dismissSheet } = useAppShellViewModel();
  const CurrentScreen = SCREENS[screen];

  return (
    <ThemeProvider value={theme}>
      <ThemeBridge theme={theme} onThemeChange={preferencesActions.setTheme} />
      <main className="app-stage">
        <section className="phone-shell" aria-label="FIN-A mobile app prototype">
          <StatusBar />
          <div className={`screen screen-${screen}`}>
            <CurrentScreen />
          </div>
          {activeTab && <BottomNav active={activeTab} onNavigate={selectTab} />}
          {sheet && <ActionSheet result={sheet} onClose={dismissSheet} />}
        </section>
      </main>
    </ThemeProvider>
  );
}

export default App;
