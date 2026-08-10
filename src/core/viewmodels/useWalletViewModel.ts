import { useShallow } from "zustand/react/shallow";
import type { CardId, CardView } from "../domain/card";
import type { IconName } from "../domain/icons";
import type { Screen } from "../navigation/screens";
import { formatMoney } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { questActions, useQuestStore } from "../stores/quest.store";
import { walletActions, useWalletStore } from "../stores/wallet.store";
import { useCardViews, useSelectedCard } from "./useCardViews";

export type ControlId = "freeze" | "online" | "atm";

export type ControlToggleVM = {
  id: ControlId;
  icon: IconName;
  title: string;
  detail: string;
  checked: boolean;
};

export type MoveMoneyRowVM = {
  id: Extract<Screen, "transfer" | "deposit" | "payments">;
  icon: IconName;
  title: string;
  detail: string;
};

export type WalletViewModel = {
  title: string;
  limitSetupActive: boolean;
  limitBanner: { title: string; detail: string };
  confirmLimitLabel: string;
  cards: readonly CardView[];
  selectedCardId: CardId;
  controlsTitle: string;
  controls: readonly ControlToggleVM[];
  spendingLimit: { title: string; detail: string; amountLabel: string; periodLabel: string };
  moveMoney: { visible: boolean; rows: readonly MoveMoneyRowVM[] };
  selectCard(id: CardId): void;
  toggleFrozen(id: CardId): void;
  setControl(id: ControlId, value: boolean): void;
  confirmLimit(): void;
  cancelLimit(): void;
  goTo(screen: Screen): void;
};

export function useWalletViewModel(): WalletViewModel {
  const navigation = useNavigation();
  const cards = useCardViews();
  const selected = useSelectedCard();
  const selectedCardId = useWalletStore((state) => state.selectedCardId);
  const frozen = useWalletStore(useShallow((state) => state.frozen));
  const { onlinePayments, atmWithdrawals } = useWalletStore(
    useShallow((state) => ({ onlinePayments: state.onlinePayments, atmWithdrawals: state.atmWithdrawals })),
  );
  const limit = useWalletStore((state) => state.limits[state.selectedCardId]);
  const limitSetupActive = useQuestStore((state) => state.limitSetupActive);
  const proposedLimit = useQuestStore((state) => state.quest.limit);

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
    cards,
    selectedCardId,
    controlsTitle: `Controls for •••• ${selected.last4}`,
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
        { id: "transfer", icon: "send", title: "Send money", detail: `From •••• ${selected.last4}` },
        { id: "deposit", icon: "arrow-down", title: "Add money", detail: "Top up this card" },
        { id: "payments", icon: "receipt", title: "Pay a bill", detail: "Billers and QR payments" },
      ],
    },
    selectCard: walletActions.selectCard,
    toggleFrozen: walletActions.toggleFrozen,
    setControl: (id, value) => {
      if (id === "freeze") walletActions.setFrozen(selectedCardId, value);
      else if (id === "online") walletActions.setOnlinePayments(value);
      else walletActions.setAtmWithdrawals(value);
    },
    confirmLimit,
    cancelLimit: questActions.cancelLimitSetup,
    goTo: navigation.navigate,
  };
}
