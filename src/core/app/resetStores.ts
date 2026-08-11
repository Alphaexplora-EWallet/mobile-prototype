import { useNavigationStore } from "../navigation/navigation.store";
import { INITIAL_SCREEN } from "../navigation/screens";
import { usePreferencesStore } from "../stores/preferences.store";
import { useQuestStore } from "../stores/quest.store";
import { useUiStore } from "../stores/ui.store";
import { useActivityStore } from "../stores/activity.store";
import { INITIAL_BILLS, useBillsStore } from "../stores/bills.store";
import { INITIAL_DEPOSIT_DRAFT, useDepositStore } from "../stores/deposit.store";
import { INITIAL_JAR_DRAFT, useJarStore } from "../stores/jar.store";
import { INITIAL_PAYMENT_FLOW, usePaymentStore } from "../stores/payment.store";
import { INITIAL_KYC, useKycStore } from "../stores/kyc.store";
import { INITIAL_QR, useQrStore } from "../stores/qr.store";
import { INITIAL_SETTINGS, useSettingsStore } from "../stores/settings.store";
import { INITIAL_RECIPIENTS, useRecipientsStore } from "../stores/recipients.store";
import { INITIAL_TRANSFER_DRAFT, useTransferStore } from "../stores/transfer.store";
import { useWalletStore } from "../stores/wallet.store";
import { INITIAL_FROZEN, MOCK_CARDS } from "../data/mock/cards.mock";
import { pesos } from "../money/money";

/**
 * Returns every store to its initial state.
 *
 * Stores are module singletons, which is what makes them reachable without
 * providers — and also what makes state leak between tests. Any test that
 * renders the app must start from a known state.
 */
export function resetStores(): void {
  useNavigationStore.setState({ stack: [INITIAL_SCREEN] });
  usePreferencesStore.setState({ theme: "light", balanceVisible: true });
  useQuestStore.setState({ phase: "available", limitSetupActive: false, rewardStyleApplied: false });
  useUiStore.setState({ sheet: null });
  useActivityStore.setState({ selectedTransactionId: null });
  useTransferStore.setState(INITIAL_TRANSFER_DRAFT);
  useJarStore.setState(INITIAL_JAR_DRAFT);
  useBillsStore.setState(INITIAL_BILLS);
  useDepositStore.setState(INITIAL_DEPOSIT_DRAFT);
  usePaymentStore.setState(INITIAL_PAYMENT_FLOW);
  useQrStore.setState(INITIAL_QR);
  useKycStore.setState(INITIAL_KYC);
  useSettingsStore.setState(INITIAL_SETTINGS);
  useRecipientsStore.setState(INITIAL_RECIPIENTS);
  useWalletStore.setState({
    // `cards` used to be safe to omit because nothing mutated it. Settling a
    // payment now writes balances back here, so it has to be restored too.
    cards: MOCK_CARDS,
    selectedCardId: "main",
    frozen: INITIAL_FROZEN,
    onlinePayments: true,
    atmWithdrawals: true,
    limits: { main: pesos(3_000), travel: pesos(3_000) },
    jar: { opened: false, balance: pesos(0) },
  });
}
