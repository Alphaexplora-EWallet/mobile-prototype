import { useNavigationStore } from "../navigation/navigation.store";
import { INITIAL_SCREEN } from "../navigation/screens";
import { usePreferencesStore } from "../stores/preferences.store";
import { useQuestStore } from "../stores/quest.store";
import { useUiStore } from "../stores/ui.store";
import { useWalletStore } from "../stores/wallet.store";
import { INITIAL_FROZEN } from "../data/mock/cards.mock";

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
  useWalletStore.setState({
    selectedCardId: "main",
    frozen: INITIAL_FROZEN,
    onlinePayments: true,
    atmWithdrawals: true,
    limits: { main: "₱3,000", travel: "₱3,000" },
  });
}
