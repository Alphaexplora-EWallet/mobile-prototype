import { useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { CardId } from "../domain/card";
import type { IconName } from "../domain/icons";
import { JAR_LABEL } from "../domain/paymentIntent";
import type { Screen } from "../navigation/screens";
import { formatMoney } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { jarActions, type JarMoveDirection } from "../stores/jar.store";
import { questActions, useQuestStore } from "../stores/quest.store";
import { walletActions, useWalletStore } from "../stores/wallet.store";
import { type CardPresentation, useCardViews, useSelectedCard } from "./useCardViews";
import { useReduceMotion } from "./useReduceMotion";

/** Matches the deck-card-stack-forward keyframe; a safety net if animationend never fires. */
const STACK_FALLBACK_MS = 520;

export type ControlId = "freeze" | "online" | "atm";

export type ControlToggleVM = {
  id: ControlId;
  icon: IconName;
  title: string;
  detail: string;
  checked: boolean;
};

export type MoveMoneyRowVM = {
  id: Extract<Screen, "transfer" | "deposit" | "cash-out" | "payments">;
  icon: IconName;
  title: string;
  detail: string;
};

export type WalletViewModel = {
  title: string;
  limitSetupActive: boolean;
  limitBanner: { title: string; detail: string };
  confirmLimitLabel: string;
  selectedCardId: CardId;
  deck: { cards: readonly CardPresentation[]; frontId: CardId; rearId: CardId | null; stackingId: CardId | null };
  controlsTitle: string;
  controls: readonly ControlToggleVM[];
  spendingLimit: { title: string; detail: string; amountLabel: string; periodLabel: string };
  moveMoney: { visible: boolean; rows: readonly MoveMoneyRowVM[] };
  /**
   * The savings jar, distinct from the card stack: its balance is separate and
   * never counts toward the main balance or the spending limit.
   */
  jar: { opened: boolean; heading: string; detail: string; balanceLabel: string };
  pressCard(id: CardId): void;
  endStacking(): void;
  toggleFrozen(id: CardId): void;
  setControl(id: ControlId, value: boolean): void;
  confirmLimit(): void;
  cancelLimit(): void;
  goTo(screen: Screen): void;
  addCard(): void;
  openAccount(): void;
  startJarMove(direction: JarMoveDirection): void;
};

export function useWalletViewModel(): WalletViewModel {
  const navigation = useNavigation();
  const cards = useCardViews();
  const frontCard = useSelectedCard();
  const selectedCardId = useWalletStore((state) => state.selectedCardId);
  const frozen = useWalletStore(useShallow((state) => state.frozen));
  const { onlinePayments, atmWithdrawals } = useWalletStore(
    useShallow((state) => ({ onlinePayments: state.onlinePayments, atmWithdrawals: state.atmWithdrawals })),
  );
  const limit = useWalletStore((state) => state.limits[state.selectedCardId]);
  const jar = useWalletStore((state) => state.jar);
  const limitSetupActive = useQuestStore((state) => state.limitSetupActive);
  const proposedLimit = useQuestStore((state) => state.quest.limit);
  const reduceMotion = useReduceMotion();

  const [stackingId, setStackingId] = useState<CardId | null>(null);

  useEffect(() => {
    if (!stackingId) return;
    const fallback = setTimeout(() => setStackingId(null), STACK_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [stackingId]);

  const frontIndex = cards.findIndex((card) => card.id === frontCard.id);
  const rearCard = cards.length > 1 ? cards[(frontIndex + 1) % cards.length] : null;

  const pressCard = useCallback(
    (id: CardId) => {
      if (stackingId || id === frontCard.id) return;
      if (!reduceMotion) setStackingId(id);
      walletActions.selectCard(id);
    },
    [stackingId, frontCard.id, reduceMotion],
  );

  const confirmLimit = () => {
    walletActions.setSpendingLimit(selectedCardId, proposedLimit);
    questActions.confirmLimit();
    navigation.navigate("quest");
  };

  return {
    title: limitSetupActive ? "Set spending limit" : "My Cards",
    limitSetupActive,
    limitBanner: { title: "Quest step", detail: "Set a limit on your main card to continue." },
    confirmLimitLabel: `Confirm ${formatMoney(proposedLimit, { fractionDigits: 0 })} limit`,
    selectedCardId,
    deck: {
      cards: rearCard ? [frontCard, rearCard] : [frontCard],
      frontId: frontCard.id,
      rearId: rearCard?.id ?? null,
      stackingId,
    },
    controlsTitle: `Controls for •••• ${frontCard.last4}`,
    controls: [
      {
        id: "freeze",
        icon: "snow",
        title: "Freeze card",
        detail: "Temporarily block your card",
        checked: frozen[selectedCardId] ?? false,
      },
      {
        id: "online",
        icon: "globe",
        title: "Online payments",
        detail: "Enable online transactions",
        checked: onlinePayments,
      },
      {
        id: "atm",
        icon: "bank",
        title: "ATM withdrawals",
        detail: "Enable for cash withdrawals",
        checked: atmWithdrawals,
      },
    ],
    spendingLimit: {
      title: "Spending limit",
      detail: "Daily limit for this card",
      amountLabel: limit ? formatMoney(limit, { fractionDigits: 0 }) : "Not set",
      periodLabel: "/ day",
    },
    moveMoney: {
      visible: !limitSetupActive,
      rows: [
        { id: "transfer", icon: "send", title: "Send money", detail: `From •••• ${frontCard.last4}` },
        { id: "deposit", icon: "arrow-down", title: "Add money", detail: "Top up this card" },
        { id: "cash-out", icon: "bank", title: "Cash out", detail: "To a linked bank account" },
        { id: "payments", icon: "receipt", title: "Pay a bill", detail: "Billers and QR payments" },
      ],
    },
    jar: {
      opened: jar.opened,
      heading: JAR_LABEL,
      detail: "Set aside money, separate from your spending",
      balanceLabel: formatMoney(jar.balance),
    },
    pressCard,
    endStacking: useCallback(() => setStackingId(null), []),
    toggleFrozen: walletActions.toggleFrozen,
    setControl: (id, value) => {
      if (id === "freeze") walletActions.setFrozen(selectedCardId, value);
      else if (id === "online") walletActions.setOnlinePayments(value);
      else walletActions.setAtmWithdrawals(value);
    },
    confirmLimit,
    cancelLimit: questActions.cancelLimitSetup,
    goTo: navigation.navigate,
    /** Both were rendered with no handler at all. */
    addCard: () => navigation.navigate("card-add"),
    openAccount: () => navigation.navigate("account-details"),
    startJarMove: (direction) => {
      jarActions.begin(direction);
      navigation.navigate("jar-move");
    },
  };
}
