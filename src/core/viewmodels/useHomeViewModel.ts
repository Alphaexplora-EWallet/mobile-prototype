import { formatMoney, formatSignedMoney, maskMoney } from "../money/format";
import { addMoney, ratio } from "../money/money";
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

export type QuickActionId = "send" | "receive" | "deposit" | "scan";

export type QuickActionVM = { id: QuickActionId; label: string; icon: IconName };

/**
 * The four actions, and the only surface that offers them. "Pay" used to sit
 * here *and* be a tab *and* be the first row of a bottom sheet on that tab; it
 * is now Scan, named for what the screen it opens actually does, and the tab
 * that duplicated it is Activity. Receive takes the arrow rather than the QR
 * glyph so Scan can have it — two QR icons side by side said nothing.
 */
const QUICK_ACTIONS: readonly QuickActionVM[] = [
  { id: "send", label: "Send", icon: "send" },
  { id: "receive", label: "Receive", icon: "arrow-down" },
  { id: "deposit", label: "Add money", icon: "plus" },
  { id: "scan", label: "Scan", icon: "qr" },
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
    /**
     * The two halves of the ring, as whole percents summing to 100. The card's
     * own legend is Income and Expenses, so the ring is that split and nothing
     * else; it used to be four hardcoded arcs of no stated meaning. Both shares
     * are given rather than one plus `100 - x` so the view does no arithmetic on
     * figures it is not allowed to read.
     */
    incomeSharePercent: number;
    expenseSharePercent: number;
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
  /** The cash-flow card and the tip card both lead here — the full breakdown. */
  openInsights(): void;
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

  // `ratio` is zero-safe on a zero base, so a period with no movement at all
  // yields 0/0 rather than NaN and the ring simply renders empty.
  const expenseShare = cashFlowSummary
    ? Math.round(
        ratio(
          cashFlowSummary.current.expenses,
          addMoney(cashFlowSummary.current.income, cashFlowSummary.current.expenses),
        ) * 100,
      )
    : 0;

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
          incomeSharePercent: 100 - expenseShare,
          expenseSharePercent: expenseShare,
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
        id === "send" ? "transfer" : id === "receive" ? "qr-receive" : id === "deposit" ? "deposit" : "payments",
      ),
    pressQuest: () => navigation.navigate("quest"),
    pressTransaction: (id: string) => {
      activityActions.selectTransaction(id);
      navigation.navigate("transaction-detail");
    },
    /** Activity is a tab now, so "See all" switches to it rather than pushing. */
    goToActivity: () => navigation.switchTab("activity"),
    openInsights: () => navigation.navigate("insights"),
    /** The avatar was rendered with no handler; Profile was tab-only. */
    openProfile: () => navigation.navigate("profile"),
    goTo: navigation.navigate,
  };
}
