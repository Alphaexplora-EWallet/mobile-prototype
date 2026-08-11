import type { CardId } from "../domain/card";
import type { Biller, DepositMethod, Recipient } from "../domain/payments";
import { MOCK_AMOUNT_PRESETS, MOCK_BILLERS, MOCK_DEPOSIT_METHODS } from "../data/mock/payments.mock";
import { findBank } from "../data/mock/banks.mock";
import { defaultRailFor } from "../domain/rails";
import { SIMULATED_NOTE } from "../domain/simulation";
import { formatMoney, parseMoneyInput } from "../money/format";
import { isZero } from "../money/money";
import { billsActions, useBillsStore } from "../stores/bills.store";
import { depositActions, useDepositStore } from "../stores/deposit.store";
import type { Screen } from "../navigation/screens";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { paymentActions } from "../stores/payment.store";
import { useRecipientsStore } from "../stores/recipients.store";
import { uiActions } from "../stores/ui.store";
import { transferActions, useTransferStore } from "../stores/transfer.store";
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
 * Exported so the cash-out screen composes the same amount field.
 */
export function createAmountDraft(amount: string, setAmount: (value: string) => void) {
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

/**
 * Both money screens back their amount with a store now — a draft has to survive
 * navigating to review and back — so the component-state version of this is gone.
 */
export type AmountDraft = ReturnType<typeof createAmountDraft>;

export type TransferViewModel = MoneyBase &
  AmountDraft & {
    note: string;
    setNote(value: string): void;
    recipients: readonly Recipient[];
    selectedRecipient: string;
    selectRecipient(id: string): void;
    review(): void;
    manageRecipients(): void;
  };

export function useTransferViewModel(): TransferViewModel {
  const base = useMoneyBase();
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const source = useSelectedCard();
  const amount = useTransferStore((state) => state.amount);
  const note = useTransferStore((state) => state.note);
  const selectedRecipient = useTransferStore((state) => state.selectedRecipient);
  const recipients = useRecipientsStore((state) => state.saved);

  return {
    ...base,
    ...createAmountDraft(amount, transferActions.setAmount),
    note,
    setNote: transferActions.setNote,
    recipients,
    selectedRecipient,
    selectRecipient: transferActions.selectRecipient,
    /**
     * Builds the intent here rather than on the review screen. Review reads one
     * intent off the store and knows nothing about where it came from, which is
     * what lets cash-in, bills and QR reuse it.
     */
    review: () => {
      const parsed = parseMoneyInput(amount);
      const recipient = recipients.find((candidate) => candidate.id === selectedRecipient);
      if (!parsed || parsed.amount <= 0 || !recipient) return;
      const bank = findBank(recipient.bankCode);
      const rail = bank ? defaultRailFor(bank) : null;
      if (!rail) return;

      paymentActions.start(
        {
          kind: "transfer",
          sourceCardId: source.id,
          sourceLabel: `${source.displayLabel} •••• ${source.last4}`,
          recipient,
          rail,
          amount: parsed,
          note,
        },
        gateway.nextIdempotencyKey(),
      );
      navigation.navigate("payment-review");
    },
    manageRecipients: () => navigation.navigate("recipients"),
  };
}

export type DepositViewModel = MoneyBase &
  AmountDraft & {
    methods: readonly DepositMethod[];
    selectedMethod: string;
    selectMethod(id: string): void;
    /** "No fee" when it is free — the strip said that unconditionally before. */
    feeLabel: string;
    arrivalLabel: string;
    canContinue: boolean;
    submit(): void;
  };

export function useDepositViewModel(): DepositViewModel {
  const base = useMoneyBase();
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const destination = useSelectedCard();
  const amount = useDepositStore((state) => state.amount);
  const selectedMethod = useDepositStore((state) => state.selectedMethod);

  const method = MOCK_DEPOSIT_METHODS.find((candidate) => candidate.id === selectedMethod) ?? MOCK_DEPOSIT_METHODS[0];
  const parsed = parseMoneyInput(amount);

  return {
    ...base,
    ...createAmountDraft(amount, depositActions.setAmount),
    methods: MOCK_DEPOSIT_METHODS,
    selectedMethod,
    selectMethod: depositActions.selectMethod,
    feeLabel: isZero(method.fee) ? "No fee" : formatMoney(method.fee),
    arrivalLabel: method.arrivalLabel,
    canContinue: method.inbound === true || Boolean(parsed && parsed.amount > 0),
    submit: () => {
      /**
       * A wallet cannot pull from another bank. For the push methods the honest
       * answer is "here is the account number to send to", not a payment form.
       */
      if (method.inbound) {
        navigation.navigate("fund-wallet");
        return;
      }
      if (!parsed || parsed.amount <= 0) return;
      paymentActions.start(
        {
          kind: "cash-in",
          destinationCardId: destination.id,
          destinationLabel: `${destination.displayLabel} •••• ${destination.last4}`,
          method,
          amount: parsed,
        },
        gateway.nextIdempotencyKey(),
      );
      navigation.navigate("payment-review");
    },
  };
}

export type PaymentsViewModel = MoneyBase & {
  scheduledLabels: readonly { id: string; glyph: string; name: string; when: string; amountLabel: string }[];
  billers: readonly Biller[];
  scanToPay(): void;
  showMyQr(): void;
  payBill(billerId: string): void;
  openAutopay(id: string): void;
};

export function usePaymentsViewModel(): PaymentsViewModel {
  const navigation = useNavigation();
  const enrollments = useBillsStore((state) => state.enrollments);

  return {
    ...useMoneyBase(),
    scanToPay: () => navigation.navigate("qr-scan"),
    showMyQr: () => navigation.navigate("qr-receive"),
    billers: MOCK_BILLERS,
    /**
     * From the store, so a paused schedule stays paused. Every enrollment starts
     * active, so these read exactly as the fixture-backed rows did.
     */
    scheduledLabels: enrollments.map((payment) => ({
      id: payment.id,
      glyph: payment.glyph,
      name: payment.name,
      when: payment.status === "paused" ? payment.when.replace("Autopay", "Paused") : payment.when,
      amountLabel: formatMoney(payment.amount),
    })),
    payBill: (billerId: string) => {
      billsActions.startBill(billerId);
      navigation.navigate("bill-entry");
    },
    openAutopay: (id: string) => {
      billsActions.selectEnrollment(id);
      navigation.navigate("autopay-detail");
    },
  };
}
