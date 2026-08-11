import { useEffect, useState } from "react";
import type { BankAccount } from "../domain/account";
import { maskCardNumber } from "../domain/card";
import { formatMoney } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { uiActions } from "../stores/ui.store";
import { walletActions, useWalletStore } from "../stores/wallet.store";
import { useSelectedCard } from "./useCardViews";

export function useAccountDetailsViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const card = useSelectedCard();

  const [accounts, setAccounts] = useState<readonly BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void gateway.accounts.list().then((result) => {
      if (!active) return;
      if (result.ok) setAccounts(result.value);
      else setError(result.error.message);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  const account = accounts.find((entry) => entry.cardId === card.id) ?? null;

  return {
    title: "Account details",
    isLoading,
    error,
    walletLabel: card.displayLabel,
    statusLabel: account ? account.status.charAt(0).toUpperCase() + account.status.slice(1) : "",
    rows: account
      ? [
          { label: "Account name", value: account.accountName },
          { label: "Account number", value: account.accountNumber },
          { label: "Bank", value: account.bankName },
          { label: "Opened", value: account.openedLabel },
          { label: "Balance", value: formatMoney(account.balance) },
        ]
      : [],
    links: [
      { id: "fund-wallet", icon: "arrow-down", title: "Fund this wallet", detail: "Your inbound account number" },
      { id: "card-detail", icon: "card", title: "Card details", detail: `${card.displayLabel} •••• ${card.last4}` },
      { id: "statements", icon: "receipt", title: "Statements", detail: "Monthly summaries" },
    ],
    open: (id: string) => navigation.navigate(id as "fund-wallet"),
    back: navigation.goBack,
  };
}

export function useCardDetailViewModel() {
  const navigation = useNavigation();
  const card = useSelectedCard();

  return {
    title: "Card details",
    cardLabel: card.displayLabel,
    maskedNumber: maskCardNumber(card.last4),
    rows: [
      { label: "Cardholder", value: card.holderName },
      { label: "Expires", value: card.expiry },
      { label: "Opened", value: card.openedLabel },
      { label: "Status", value: card.frozen ? "Frozen" : "Active" },
    ],
    /**
     * All three need an issuer flow — a PIN keypad on a secure element, a
     * replacement order, a courier. None belongs in a prototype pretending.
     */
    changePin: () => uiActions.showSimulated("Change card PIN"),
    reportLost: () => uiActions.showSimulated("Report card lost"),
    orderReplacement: () => uiActions.showSimulated("Order a replacement card"),
    back: navigation.goBack,
  };
}

export function useCardAddViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const jarOpened = useWalletStore((state) => state.jar.opened);
  const [error, setError] = useState<string | null>(null);

  const openJar = async () => {
    // Opening the jar is a bank-side outcome, so it is simulated through the
    // gateway; the jar card face then appears on the Wallet screen. A failure
    // keeps the user here with the reason, like every other gateway error.
    const result = await gateway.payments.openJar();
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    walletActions.setJarState(result.value);
    navigation.navigate("wallet");
  };

  return {
    title: "Add a card",
    intro: "Choose what you want to open. A prototype cannot issue a real card, so the card options end in a summary.",
    jarOpened,
    error,
    options: [
      {
        id: "virtual",
        icon: "card" as const,
        title: "Virtual card",
        detail: "Instant, for online payments only",
      },
      {
        id: "physical",
        icon: "wallet" as const,
        title: "Physical card",
        detail: "Delivered in 5 to 7 banking days",
      },
      ...(jarOpened
        ? []
        : [
            {
              id: "jar",
              icon: "star" as const,
              title: "Savings jar",
              detail: "A separate balance with its own card face",
            },
          ]),
    ],
    choose: (id: string) => {
      if (id === "jar") {
        void openJar();
        return;
      }
      uiActions.showSimulated(`Open a ${id} card`);
    },
    back: navigation.goBack,
  };
}
