import { useState } from "react";
import type { CardId } from "../domain/card";
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
import { formatMoney, parseMoneyInput } from "../money/format";
import type { Screen } from "../navigation/screens";
import { useNavigation } from "../navigation/useNavigation";
import { uiActions } from "../stores/ui.store";
import { walletActions } from "../stores/wallet.store";
import { type CardPresentation, useCardViews, useSelectedCard } from "./useCardViews";

/** Shared by the three money screens: an account picker, an amount, and a simulated submit. */
type MoneyBase = {
  cards: readonly CardPresentation[];
  source: CardPresentation;
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
    simulatedNote: SIMULATED_NOTE,
    selectCard: walletActions.selectCard,
    simulate: uiActions.showSimulated,
    goTo: navigation.navigate,
    // Kept as an explicit destination rather than goBack() so this step does
    // not change behaviour; the navigation stack now makes true back possible.
    back: () => navigation.navigate("home"),
  };
}

export type PresetVM = { id: string; label: string };

/**
 * Presets are matched on parsed value, not on string equality. Typing "500.00"
 * previously failed to highlight the ₱500 preset because "500.00" !== "500".
 */
function useAmountDraft() {
  const [amount, setAmount] = useState("");
  const parsed = parseMoneyInput(amount);
  const presets: PresetVM[] = MOCK_AMOUNT_PRESETS.map((preset) => ({
    id: formatMoney(preset, { symbol: false, fractionDigits: 0 }),
    label: formatMoney(preset, { fractionDigits: 0 }),
  }));
  const selectedPresetId =
    MOCK_AMOUNT_PRESETS.reduce<string | null>(
      (found, preset, index) => found ?? (parsed && parsed.amount === preset.amount ? presets[index].id : null),
      null,
    ) ?? null;
  return { amount, setAmount, presets, selectedPresetId, selectPreset: setAmount };
}

export type AmountDraft = ReturnType<typeof useAmountDraft>;

export type TransferViewModel = MoneyBase &
  AmountDraft & {
    note: string;
    setNote(value: string): void;
    recipients: readonly Recipient[];
    selectedRecipient: string;
    selectRecipient(initials: string): void;
  };

export function useTransferViewModel(): TransferViewModel {
  const base = useMoneyBase();
  const draft = useAmountDraft();
  const [note, setNote] = useState("");
  const [selectedRecipient, selectRecipient] = useState(MOCK_RECIPIENTS[0].initials);
  return { ...base, ...draft, note, setNote, recipients: MOCK_RECIPIENTS, selectedRecipient, selectRecipient };
}

export type DepositViewModel = MoneyBase &
  AmountDraft & {
    methods: readonly DepositMethod[];
    selectedMethod: string;
    selectMethod(id: string): void;
  };

export function useDepositViewModel(): DepositViewModel {
  const base = useMoneyBase();
  const draft = useAmountDraft();
  const [selectedMethod, selectMethod] = useState(MOCK_DEPOSIT_METHODS[0].id);
  return { ...base, ...draft, methods: MOCK_DEPOSIT_METHODS, selectedMethod, selectMethod };
}

export type PaymentsViewModel = MoneyBase & {
  scheduledLabels: readonly { id: string; glyph: string; name: string; when: string; amountLabel: string }[];
  billers: readonly Biller[];
  scheduled: readonly ScheduledPayment[];
};

export function usePaymentsViewModel(): PaymentsViewModel {
  return {
    ...useMoneyBase(),
    billers: MOCK_BILLERS,
    scheduled: MOCK_SCHEDULED_PAYMENTS,
    scheduledLabels: MOCK_SCHEDULED_PAYMENTS.map((payment) => ({
      id: payment.id,
      glyph: payment.glyph,
      name: payment.name,
      when: payment.when,
      amountLabel: formatMoney(payment.amount),
    })),
  };
}
