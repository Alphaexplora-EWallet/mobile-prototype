import { formatMoney, formatSignedMoney, maskMoney } from "../money/format";
import type { IconName } from "../domain/icons";
import { levelFromXp } from "../domain/progress";
import { isIncoming } from "../domain/transaction";
import { balanceDeltaFromLastMonth, buildCashFlowSummary, type PercentChange } from "../domain/cashFlow";
import { MOCK_TRANSACTIONS } from "../data/mock/payments.mock";
import { MOCK_MONEY_STYLE } from "../data/mock/quiz.mock";
import { MOCK_STATEMENTS } from "../data/mock/compliance.mock";
import type { Screen } from "../navigation/screens";
import { useNavigation } from "../navigation/useNavigation";
import { preferencesActions, usePreferencesStore } from "../stores/preferences.store";
import { useQuestStore } from "../stores/quest.store";
import { activityActions } from "../stores/activity.store";
import type { Theme } from "@/ui/theme/ThemeContext";
import type { CardPresentation } from "./useCardViews";
import { useSelectedCard } from "./useCardViews";

export type QuickActionId = "send" | "request" | "deposit" | "pay";

export type QuickActionVM = { id: QuickActionId; label: string; icon: IconName };

const QUICK_ACTIONS: readonly QuickActionVM[] = [
  { id: "send", label: "Send", icon: "send" },
  { id: "request", label: "Request", icon: "arrow-down" },
  { id: "deposit", label: "Add money", icon: "plus" },
  { id: "pay", label: "Pay", icon: "qr" },
];

/** Arrow glyph per direction — "flat" still needs one, never a blank chip. */
const CHANGE_ARROW: Readonly<Record<PercentChange["direction"], string>> = { up: "↑", down: "↓", flat: "→" };

/** `{ percent: -6, direction: "down" }` → "↓6%". Formatting stays at this boundary, never in `core/domain`. */
const formatPercentChange = (
  change: PercentChange | null,
): { label: string; direction: PercentChange["direction"] } | null =>
  change
    ? { label: `${CHANGE_ARROW[change.direction]}${Math.abs(change.percent)}%`, direction: change.direction }
    : null;

export type PercentChangeVM = { label: string; direction: PercentChange["direction"] };

export type HomeViewModel = {
  theme: Theme;
  themeToggleLabel: string;
  balance: {
    heading: string;
    label: string;
    visible: boolean;
    toggleLabel: string;
    /** "↑12% from last month" under the peso figure. Absent when there is no prior month to compare against. */
    delta: { label: string; direction: PercentChange["direction"] } | null;
  };
  card: CardPresentation;
  quickActions: readonly QuickActionVM[];
  quest: { titleLines: readonly string[]; spendLabel: string; progressPercent: number; hoursLeftLabel: string };
  styleProgress: { title: string; percent: number; percentLabel: string };
  /** Income vs. expenses for the latest closed statement month. Null when there are no statements at all. */
  cashFlow: {
    periodLabel: string;
    incomeLabel: string;
    expensesLabel: string;
    incomeChange: PercentChangeVM | null;
    expensesChange: PercentChangeVM | null;
  } | null;
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
  pressCard(): void;
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
  const level = levelFromXp(useQuestStore((state) => state.xpTotal));

  // MOCK_STATEMENTS reconciles against the main wallet's balance only — the
  // travel jar has no statement history of its own, so the delta badge stays
  // hidden while a different card is selected rather than comparing balances
  // that were never the same ledger.
  const delta =
    selected.id === "main" ? formatPercentChange(balanceDeltaFromLastMonth(selected.balance, MOCK_STATEMENTS)) : null;
  const cashFlowSummary = buildCashFlowSummary(MOCK_STATEMENTS);

  return {
    theme,
    themeToggleLabel: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
    balance: {
      heading: "Available balance",
      label: balanceVisible ? formatMoney(selected.balance) : maskMoney(selected.balance),
      visible: balanceVisible,
      toggleLabel: `${balanceVisible ? "Hide" : "Show"} ${selected.displayLabel} balance`,
      delta: delta ? { label: `${delta.label} from last month`, direction: delta.direction } : null,
    },
    card: selected,
    quickActions: QUICK_ACTIONS,
    cashFlow: cashFlowSummary
      ? {
          periodLabel: cashFlowSummary.current.periodLabel,
          incomeLabel: formatMoney(cashFlowSummary.current.income, { fractionDigits: 0 }),
          expensesLabel: formatMoney(cashFlowSummary.current.expenses, { fractionDigits: 0 }),
          incomeChange: formatPercentChange(cashFlowSummary.incomeChange),
          expensesChange: formatPercentChange(cashFlowSummary.expensesChange),
        }
      : null,
    quest: {
      titleLines: quest.titleLines,
      spendLabel: `${formatMoney(quest.spent, { fractionDigits: 0 })} of ${formatMoney(quest.limit, { fractionDigits: 0 })}`,
      progressPercent: quest.progressPercent,
      hoursLeftLabel: quest.hoursLeftLabel,
    },
    styleProgress: {
      title: `${MOCK_MONEY_STYLE.name} · Level ${level.level}`,
      percent: level.percent,
      percentLabel: `${level.percent}%`,
    },
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
    pressCard: () => navigation.switchTab("wallet"),
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
