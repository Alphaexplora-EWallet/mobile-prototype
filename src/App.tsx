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
import { SignUpScreen } from "@/ui/screens/SignUpScreen";
import { SignUpOtpScreen } from "@/ui/screens/SignUpOtpScreen";
import { SignUpDetailsScreen } from "@/ui/screens/SignUpDetailsScreen";
import { SignUpPinScreen } from "@/ui/screens/SignUpPinScreen";
import { SignUpDoneScreen } from "@/ui/screens/SignUpDoneScreen";
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
import { PersonalDetailsScreen } from "@/ui/screens/PersonalDetailsScreen";
import { ActivityScreen } from "@/ui/screens/ActivityScreen";
import { TransactionDetailScreen } from "@/ui/screens/TransactionDetailScreen";
import { RecipientsScreen } from "@/ui/screens/RecipientsScreen";
import { TransferDestinationScreen } from "@/ui/screens/TransferDestinationScreen";
import { SendMobileScreen } from "@/ui/screens/SendMobileScreen";
import { PaymentReviewScreen } from "@/ui/screens/PaymentReviewScreen";
import { PaymentConfirmScreen } from "@/ui/screens/PaymentConfirmScreen";
import { PaymentReceiptScreen } from "@/ui/screens/PaymentReceiptScreen";
import { PaymentStatusScreen } from "@/ui/screens/PaymentStatusScreen";
import { FundWalletScreen } from "@/ui/screens/FundWalletScreen";
import { CashOutScreen } from "@/ui/screens/CashOutScreen";
import { JarMoveScreen } from "@/ui/screens/JarMoveScreen";
import { QrScanScreen } from "@/ui/screens/QrScanScreen";
import { QrReceiveScreen } from "@/ui/screens/QrReceiveScreen";
import { BillEntryScreen } from "@/ui/screens/BillEntryScreen";
import { AutopayDetailScreen } from "@/ui/screens/AutopayDetailScreen";
import { LoadEntryScreen } from "@/ui/screens/LoadEntryScreen";
import { RequestEntryScreen } from "@/ui/screens/RequestEntryScreen";
import { SettingsScreen } from "@/ui/screens/SettingsScreen";
import { BankAccountsScreen } from "@/ui/screens/BankAccountsScreen";
import { NotificationsScreen } from "@/ui/screens/NotificationsScreen";
import { SecuritySettingsScreen } from "@/ui/screens/SecuritySettingsScreen";
import { AccountDetailsScreen } from "@/ui/screens/AccountDetailsScreen";
import { CardDetailScreen } from "@/ui/screens/CardDetailScreen";
import { CardAddScreen } from "@/ui/screens/CardAddScreen";
import { LimitsScreen } from "@/ui/screens/LimitsScreen";
import { KycStatusScreen } from "@/ui/screens/KycStatusScreen";
import { KycCaptureScreen } from "@/ui/screens/KycCaptureScreen";
import { StatementsScreen } from "@/ui/screens/StatementsScreen";
import { StatementMonthScreen } from "@/ui/screens/StatementMonthScreen";
import { HelpScreen } from "@/ui/screens/HelpScreen";
import { DisputeScreen } from "@/ui/screens/DisputeScreen";
import { SignInOtpScreen } from "@/ui/screens/SignInOtpScreen";
import { ForgotPasswordScreen } from "@/ui/screens/ForgotPasswordScreen";
import { SpendingInsightsScreen } from "@/ui/screens/SpendingInsightsScreen";

/**
 * Where a Screen id meets a component, and the only place that mapping lives.
 * Screens take no props: each reads its own ViewModel.
 */
const SCREENS: Record<Screen, () => JSX.Element> = {
  welcome: WelcomeScreen,
  "sign-in": SignInScreen,
  "sign-up": SignUpScreen,
  "sign-up-otp": SignUpOtpScreen,
  "sign-up-details": SignUpDetailsScreen,
  "sign-up-pin": SignUpPinScreen,
  "sign-up-done": SignUpDoneScreen,
  quiz: QuizScreen,
  result: ResultScreen,
  home: HomeScreen,
  wallet: WalletScreen,
  transfer: TransferScreen,
  recipients: RecipientsScreen,
  "transfer-destination": TransferDestinationScreen,
  "send-mobile": SendMobileScreen,
  "payment-review": PaymentReviewScreen,
  "payment-confirm": PaymentConfirmScreen,
  "payment-receipt": PaymentReceiptScreen,
  "payment-status": PaymentStatusScreen,
  deposit: DepositScreen,
  "fund-wallet": FundWalletScreen,
  "cash-out": CashOutScreen,
  "jar-move": JarMoveScreen,
  "qr-scan": QrScanScreen,
  "qr-receive": QrReceiveScreen,
  "bill-entry": BillEntryScreen,
  "autopay-detail": AutopayDetailScreen,
  "load-entry": LoadEntryScreen,
  "request-entry": RequestEntryScreen,
  payments: PaymentsScreen,
  activity: ActivityScreen,
  "transaction-detail": TransactionDetailScreen,
  quest: QuestScreen,
  reward: RewardScreen,
  profile: ProfileScreen,
  "personal-details": PersonalDetailsScreen,
  settings: SettingsScreen,
  "bank-accounts": BankAccountsScreen,
  notifications: NotificationsScreen,
  "security-settings": SecuritySettingsScreen,
  "account-details": AccountDetailsScreen,
  "card-detail": CardDetailScreen,
  "card-add": CardAddScreen,
  limits: LimitsScreen,
  "kyc-status": KycStatusScreen,
  "kyc-capture": KycCaptureScreen,
  statements: StatementsScreen,
  "statement-month": StatementMonthScreen,
  help: HelpScreen,
  dispute: DisputeScreen,
  "sign-in-otp": SignInOtpScreen,
  "forgot-password": ForgotPasswordScreen,
  insights: SpendingInsightsScreen,
};

function App() {
  const { theme, screen, activeTab, sheet, selectTab, dismissSheet, confirmSheet } = useAppShellViewModel();
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
          {sheet && <ActionSheet result={sheet} onClose={dismissSheet} onConfirm={confirmSheet} />}
        </section>
      </main>
    </ThemeProvider>
  );
}

export default App;
