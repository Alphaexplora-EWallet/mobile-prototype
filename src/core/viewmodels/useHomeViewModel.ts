import { useCallback, useEffect, useState } from "react";
import type { CardId, CardView } from "../domain/card";
import { maskBalance } from "../domain/card";
import type { IconName } from "../domain/icons";
import type { Transaction } from "../domain/transaction";
import { MOCK_TRANSACTIONS } from "../data/mock/payments.mock";
import type { Screen } from "../navigation/screens";
import { useNavigation } from "../navigation/useNavigation";
import { preferencesActions, usePreferencesStore } from "../stores/preferences.store";
import { useQuestStore } from "../stores/quest.store";
import { uiActions } from "../stores/ui.store";
import { walletActions, useWalletStore } from "../stores/wallet.store";
import type { Theme } from "@/ui/theme/ThemeContext";
import { useCardViews } from "./useCardViews";
import { useReduceMotion } from "./useReduceMotion";

/** Matches the home-card-stack-forward keyframe; a safety net if animationend never fires. */
const STACK_FALLBACK_MS = 520;

export type QuickActionId = "send" | "deposit" | "pay";

export type QuickActionVM = { id: QuickActionId; label: string; icon: IconName };

const QUICK_ACTIONS: readonly QuickActionVM[] = [
  { id: "send", label: "Send", icon: "send" },
  { id: "deposit", label: "Add money", icon: "plus" },
  { id: "pay", label: "Pay", icon: "qr" },
];

export type HomeViewModel = {
  theme: Theme;
  themeToggleLabel: string;
  balance: { heading: string; label: string; visible: boolean; toggleLabel: string; isChanging: boolean };
  deck: { cards: readonly CardView[]; activeId: CardId; rearId: CardId | null; stackingId: CardId | null };
  quickActions: readonly QuickActionVM[];
  quest: { titleLines: readonly string[]; spendLabel: string; progressPercent: number; hoursLeftLabel: string };
  styleProgress: { title: string; percent: number; percentLabel: string };
  transactions: readonly Transaction[];
  toggleTheme(): void;
  toggleBalance(): void;
  pressCard(id: CardId): void;
  pressNextCard(): void;
  endStacking(): void;
  pressQuickAction(id: QuickActionId): void;
  pressQuest(): void;
  pressTransaction(name: string): void;
  goTo(screen: Screen): void;
};

export function useHomeViewModel(): HomeViewModel {
  const navigation = useNavigation();
  const cards = useCardViews();
  const reduceMotion = useReduceMotion();
  const theme = usePreferencesStore((state) => state.theme);
  const balanceVisible = usePreferencesStore((state) => state.balanceVisible);
  const selectedCardId = useWalletStore((state) => state.selectedCardId);
  const quest = useQuestStore((state) => state.quest);

  const [stackingId, setStackingId] = useState<CardId | null>(null);

  useEffect(() => {
    if (!stackingId) return;
    const fallback = setTimeout(() => setStackingId(null), STACK_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [stackingId]);

  const activeIndex = Math.max(
    0,
    cards.findIndex((card) => card.id === selectedCardId),
  );
  const activeCard = cards[activeIndex] ?? cards[0];
  const rearCard = cards.length > 1 ? cards[(activeIndex + 1) % cards.length] : null;

  const pressCard = useCallback(
    (id: CardId) => {
      if (stackingId) return;
      if (id === activeCard.id) {
        navigation.navigate("wallet");
        return;
      }
      if (!reduceMotion) setStackingId(id);
      walletActions.selectCard(id);
    },
    [stackingId, activeCard.id, reduceMotion, navigation],
  );

  return {
    theme,
    themeToggleLabel: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
    balance: {
      heading: "Available balance",
      label: balanceVisible ? activeCard.balance : maskBalance(activeCard.balance),
      visible: balanceVisible,
      toggleLabel: `${balanceVisible ? "Hide" : "Show"} ${activeCard.displayLabel} balance`,
      isChanging: stackingId !== null,
    },
    deck: {
      cards: rearCard ? [activeCard, rearCard] : [activeCard],
      activeId: activeCard.id,
      rearId: rearCard?.id ?? null,
      stackingId,
    },
    quickActions: QUICK_ACTIONS,
    quest: {
      titleLines: quest.titleLines,
      spendLabel: `${quest.spentLabel} of ${quest.limitLabel}`,
      progressPercent: quest.progressPercent,
      hoursLeftLabel: quest.hoursLeftLabel,
    },
    styleProgress: { title: "The Free Spirit · Level 3", percent: 75, percentLabel: "75%" },
    transactions: MOCK_TRANSACTIONS,
    toggleTheme: preferencesActions.toggleTheme,
    toggleBalance: preferencesActions.toggleBalanceVisibility,
    pressCard,
    pressNextCard: () => rearCard && pressCard(rearCard.id),
    endStacking: useCallback(() => setStackingId(null), []),
    pressQuickAction: (id) =>
      navigation.navigate(id === "send" ? "transfer" : id === "deposit" ? "deposit" : "payments"),
    pressQuest: () => navigation.navigate("quest"),
    pressTransaction: uiActions.showSimulated,
    goTo: navigation.navigate,
  };
}
