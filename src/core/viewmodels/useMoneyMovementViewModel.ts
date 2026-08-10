import { useState } from "react";
import type { CardId, CardView } from "../domain/card";
import type { Biller, DepositMethod, Recipient } from "../domain/payments";
import type { ScheduledPayment } from "../domain/transaction";
import {
  MOCK_AMOUNT_PRESETS,
  MOCK_BILLERS,
  MOCK_DEPOSIT_METHODS,
  MOCK_RECIPIENTS,
  MOCK_SCHEDULED_PAYMENTS,
} from "../data/mock/payments.mock";
import { SIMULATED_NOTE } from "../domain/simulation";
import type { Screen } from "../navigation/screens";
import { useNavigation } from "../navigation/useNavigation";
import { uiActions } from "../stores/ui.store";
import { walletActions } from "../stores/wallet.store";
import { useCardViews, useSelectedCard } from "./useCardViews";

/** Shared by the three money screens: an account picker, an amount, and a simulated submit. */
type MoneyBase = {
  cards: readonly CardView[];
  source: CardView;
  amountPresets: readonly string[];
  /** Copy, therefore ViewModel output rather than a constant imported by the view. */
  simulatedNote: string;
  selectCard(id: CardId): void;
  simulate(title: string): void;
  goTo(screen: Screen): void;
  back(): void;
};

function useMoneyBase(): MoneyBase {
  const navigation = useNavigation();
  return {
    cards: useCardViews(),
    source: useSelectedCard(),
    amountPresets: MOCK_AMOUNT_PRESETS,
    simulatedNote: SIMULATED_NOTE,
    selectCard: walletActions.selectCard,
    simulate: uiActions.showSimulated,
    goTo: navigation.navigate,
    // Kept as an explicit destination rather than goBack() so this step does
    // not change behaviour; the navigation stack now makes true back possible.
    back: () => navigation.navigate("home"),
  };
}

export type TransferViewModel = MoneyBase & {
  amount: string;
  setAmount(value: string): void;
  note: string;
  setNote(value: string): void;
  recipients: readonly Recipient[];
  selectedRecipient: string;
  selectRecipient(initials: string): void;
};

export function useTransferViewModel(): TransferViewModel {
  const base = useMoneyBase();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedRecipient, selectRecipient] = useState(MOCK_RECIPIENTS[0].initials);
  return { ...base, amount, setAmount, note, setNote, recipients: MOCK_RECIPIENTS, selectedRecipient, selectRecipient };
}

export type DepositViewModel = MoneyBase & {
  amount: string;
  setAmount(value: string): void;
  methods: readonly DepositMethod[];
  selectedMethod: string;
  selectMethod(id: string): void;
};

export function useDepositViewModel(): DepositViewModel {
  const base = useMoneyBase();
  const [amount, setAmount] = useState("");
  const [selectedMethod, selectMethod] = useState(MOCK_DEPOSIT_METHODS[0].id);
  return { ...base, amount, setAmount, methods: MOCK_DEPOSIT_METHODS, selectedMethod, selectMethod };
}

export type PaymentsViewModel = MoneyBase & {
  billers: readonly Biller[];
  scheduled: readonly ScheduledPayment[];
};

export function usePaymentsViewModel(): PaymentsViewModel {
  return { ...useMoneyBase(), billers: MOCK_BILLERS, scheduled: MOCK_SCHEDULED_PAYMENTS };
}
