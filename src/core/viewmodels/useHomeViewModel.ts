import { formatMoney, formatSignedMoney, maskMoney } from "../money/format";
import type { IconName } from "../domain/icons";
import { isIncoming } from "../domain/transaction";
import { MOCK_TRANSACTIONS } from "../data/mock/payments.mock";
import type { Screen } from "../navigation/screens";
import { useNavigation } from "../navigation/useNavigation";
import { preferencesActions, usePreferencesStore } from "../stores/preferences.store";
import { useQuestStore } from "../stores/quest.store";
import { activityActions } from "../stores/activity.store";
import type { Theme } from "@/ui/theme/ThemeContext";
import { useSelectedCard } from "./useCardViews";

export type QuickActionId = "send" | "request" | "deposit" | "pay";

export type QuickActionVM = { id: QuickActionId; label: string; icon: IconName };

const QUICK_ACTIONS: readonly QuickActionVM[] = [
  { id: "send", label: "Send", icon: "send" },
  { id: "request", label: "Request", icon: "arrow-down" },
  { id: "deposit", label: "Add money", icon: "plus" },
  { id: "pay", label: "Pay", icon: "qr" },
];

export type HomeViewModel = {
  theme: Theme;
  themeToggleLabel: string;
  balance: { heading: string; label: string; visible: boolean; toggleLabel: string };
  quickActions: readonly QuickActionVM[];
  quest: { titleLines: readonly string[]; spendLabel: string; progressPercent: number; hoursLeftLabel: string };
  styleProgress: { title: string; percent: number; percentLabel: string };
  transactions: readonly {
    id: string;
    glyph: string;
    name: string;
    when: string;
    amountLabel: string;
    incoming: boolean;
  }[];
  toggleTheme(): void;
  toggleBalance(): void;
  pressQuickAction(id: QuickActionId): void;
  pressQuest(): void;
  pressTransaction(id: string): void;
  goToActivity(): void;
  openProfile(): void;
  goTo(screen: Screen): void;
};

export function useHomeViewModel(): HomeViewModel {
  const navigation = useNavigation();
  const selected = useSelectedCard();
  const theme = usePreferencesStore((state) => state.theme);
  const balanceVisible = usePreferencesStore((state) => state.balanceVisible);
  const quest = useQuestStore((state) => state.quest);

  return {
    theme,
    themeToggleLabel: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
    balance: {
      heading: "Available balance",
      label: balanceVisible ? formatMoney(selected.balance) : maskMoney(selected.balance),
      visible: balanceVisible,
      toggleLabel: `${balanceVisible ? "Hide" : "Show"} ${selected.displayLabel} balance`,
    },
    quickActions: QUICK_ACTIONS,
    quest: {
      titleLines: quest.titleLines,
      spendLabel: `${formatMoney(quest.spent, { fractionDigits: 0 })} of ${formatMoney(quest.limit, { fractionDigits: 0 })}`,
      progressPercent: quest.progressPercent,
      hoursLeftLabel: quest.hoursLeftLabel,
    },
    styleProgress: { title: "The Free Spirit · Level 3", percent: 75, percentLabel: "75%" },
    transactions: MOCK_TRANSACTIONS.map((transaction) => ({
      id: transaction.id,
      glyph: transaction.glyph,
      name: transaction.name,
      when: transaction.when,
      amountLabel: formatSignedMoney(transaction.amount),
      incoming: isIncoming(transaction),
    })),
    toggleTheme: preferencesActions.toggleTheme,
    toggleBalance: preferencesActions.toggleBalanceVisibility,
    pressQuickAction: (id) =>
      navigation.navigate(
        id === "send" ? "transfer" : id === "request" ? "request-entry" : id === "deposit" ? "deposit" : "payments",
      ),
    pressQuest: () => navigation.navigate("quest"),
    pressTransaction: (id: string) => {
      activityActions.selectTransaction(id);
      navigation.navigate("transaction-detail");
    },
    goToActivity: () => navigation.navigate("activity"),
    /** The avatar was rendered with no handler; Profile was tab-only. */
    openProfile: () => navigation.navigate("profile"),
    goTo: navigation.navigate,
  };
}
