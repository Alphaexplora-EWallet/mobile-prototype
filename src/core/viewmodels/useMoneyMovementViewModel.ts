import { useState } from "react";
import type { CardId } from "../domain/card";
import type { Biller, BillerCategory, DepositMethod, Recipient } from "../domain/payments";
import type { LoadOperator } from "../domain/load";
import { BILLER_CATEGORY_LABELS, BILLER_CATEGORY_ORDER, searchBillers } from "../domain/payments";
import {
  MOCK_AMOUNT_PRESETS,
  MOCK_BILLERS,
  MOCK_DEPOSIT_METHODS,
  MOCK_LOAD_OPERATORS,
} from "../data/mock/payments.mock";
import { findBank, RAIL_PRICING } from "../data/mock/banks.mock";
import { defaultRailFor } from "../domain/rails";
import { SIMULATED_NOTE } from "../domain/simulation";
import { formatMoney, parseMoneyInput } from "../money/format";
import { isZero, type Money } from "../money/money";
import { billsActions, useBillsStore } from "../stores/bills.store";
import { billerCatalogActions, useBillerCatalogStore } from "../stores/billerCatalog.store";
import { buyloadActions } from "../stores/buyload.store";
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
 * Exported so the cash-out screen composes the same amount field. Load uses
 * smaller denominations, so the preset list is a parameter with the transfer
 * presets as the default.
 */
export function createAmountDraft(
  amount: string,
  setAmount: (value: string) => void,
  presets: readonly Money[] = MOCK_AMOUNT_PRESETS,
) {
  const parsed = parseMoneyInput(amount);
  const presetViews: PresetVM[] = presets.map((preset) => ({
    id: formatMoney(preset, { symbol: false, fractionDigits: 0 }),
    label: formatMoney(preset, { fractionDigits: 0 }),
  }));
  const selectedPresetId =
    presets.reduce<string | null>(
      (found, preset, index) => found ?? (parsed && parsed.amount === preset.amount ? presetViews[index].id : null),
      null,
    ) ?? null;
  return { amount, setAmount, presets: presetViews, selectedPresetId, selectPreset: setAmount };
}

/**
 * Both money screens back their amount with a store now — a draft has to survive
 * navigating to review and back — so the component-state version of this is gone.
 */
export type AmountDraft = ReturnType<typeof createAmountDraft>;

/**
 * Send money's over-balance message. Unparsable input and a zero/empty amount
 * stay silent — the primary button is just disabled — since an amount step
 * shouldn't scold a value the user hasn't finished typing yet. Add money has
 * no equivalent: there is no external-source limit to check the amount
 * against, so it defers to the gateway's `insufficient-funds` result instead.
 */
function amountLimitError(amount: string, parsed: Money | null, limit: Money, limitLabel: string): string | null {
  if (amount.trim() === "") return null;
  if (!parsed) return "Enter a valid amount.";
  if (parsed.amount <= 0) return null;
  if (parsed.amount > limit.amount) return `That's more than your available balance (${limitLabel}).`;
  return null;
}

export type FeePreviewVM = { feeLabel: string; arrivalLabel: string };

export type TransferViewModel = MoneyBase &
  AmountDraft & {
    step: 1 | 2;
    canAdvance: boolean;
    advance(): void;
    note: string;
    setNote(value: string): void;
    recipients: readonly Recipient[];
    filteredRecipients: readonly Recipient[];
    searchQuery: string;
    setSearchQuery(value: string): void;
    selectedRecipient: string;
    selectedRecipientDetails: Recipient | null;
    selectRecipient(id: string): void;
    setMaxAmount(): void;
    sendToBank(): void;
    sendToMobile(): void;
    scanQr(): void;
    /** Local, non-authoritative — `gateway.payments.quote()` at payment-review is the source of truth. */
    feePreview: FeePreviewVM | null;
    amountError: string | null;
    review(): void;
    manageRecipients(): void;
  };

export function useTransferViewModel(): TransferViewModel {
  const base = useMoneyBase();
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const source = useSelectedCard();
  const step = useTransferStore((state) => state.step);
  const amount = useTransferStore((state) => state.amount);
  const note = useTransferStore((state) => state.note);
  const selectedRecipient = useTransferStore((state) => state.selectedRecipient);
  const recipients = useRecipientsStore((state) => state.saved);
  const [searchQuery, setSearchQuery] = useState("");

  const recipient = recipients.find((candidate) => candidate.id === selectedRecipient) ?? null;
  const bank = recipient ? findBank(recipient.bankCode) : null;
  const previewRail = bank ? defaultRailFor(bank) : null;
  const pricing = previewRail ? RAIL_PRICING[previewRail] : null;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredRecipients =
    normalizedQuery === ""
      ? recipients
      : recipients.filter(
          (person) =>
            person.name.toLowerCase().includes(normalizedQuery) ||
            person.handle.toLowerCase().includes(normalizedQuery) ||
            person.bankCode.toLowerCase().includes(normalizedQuery),
        );

  const parsed = parseMoneyInput(amount);
  const canAdvance =
    step === 1
      ? selectedRecipient !== ""
      : parsed !== null && parsed.amount > 0 && parsed.amount <= source.balance.amount;

  /**
   * Builds the intent here rather than on the review screen. Review reads one
   * intent off the store and knows nothing about where it came from, which is
   * what lets cash-in, bills and QR reuse it.
   */
  const review = () => {
    if (!parsed || parsed.amount <= 0 || !recipient || !previewRail) return;

    paymentActions.start(
      {
        kind: "transfer",
        sourceCardId: source.id,
        sourceLabel: `${source.displayLabel} •••• ${source.last4}`,
        recipient,
        rail: previewRail,
        amount: parsed,
        note,
      },
      gateway.nextIdempotencyKey(),
    );
    navigation.navigate("payment-review");
  };

  const setMaxAmount = () => {
    const rawMax = formatMoney(source.balance, { symbol: false, grouping: false });
    transferActions.setAmount(rawMax);
  };

  return {
    ...base,
    ...createAmountDraft(amount, transferActions.setAmount),
    step,
    canAdvance,
    advance: () => (step === 1 ? transferActions.nextStep() : review()),
    note,
    setNote: transferActions.setNote,
    recipients,
    filteredRecipients,
    searchQuery,
    setSearchQuery,
    selectedRecipient,
    selectedRecipientDetails: recipient,
    selectRecipient: transferActions.selectRecipient,
    setMaxAmount,
    sendToBank: () => navigation.navigate("transfer-destination"),
    sendToMobile: () => navigation.navigate("send-mobile"),
    scanQr: () => navigation.navigate("qr-scan"),
    feePreview: pricing
      ? { feeLabel: isZero(pricing.fee) ? "No fee" : formatMoney(pricing.fee), arrivalLabel: pricing.arrivalLabel }
      : null,
    amountError: amountLimitError(amount, parsed, source.balance, source.balanceLabel),
    review,
    manageRecipients: () => navigation.navigate("recipients"),
    back: () => (step === 1 ? base.back() : transferActions.previousStep()),
  };
}

export type DepositMethodGroupVM = { label: string; methods: readonly DepositMethod[] };

export type DepositViewModel = MoneyBase &
  AmountDraft & {
    step: 1 | 2;
    canAdvance: boolean;
    advance(): void;
    /** "Instant" (pulled, quoted) methods first, "Manual" (pushed to the wallet) second. */
    methodGroups: readonly DepositMethodGroupVM[];
    selectedMethod: string;
    selectMethod(id: string): void;
    /** "Get account number" for an inbound method, "Continue" otherwise — the branch is visible before it happens. */
    step1ActionLabel: string;
    /** "No fee" when it is free — the strip said that unconditionally before. */
    feeLabel: string;
    arrivalLabel: string;
    submit(): void;
  };

export function useDepositViewModel(): DepositViewModel {
  const base = useMoneyBase();
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const destination = useSelectedCard();
  const step = useDepositStore((state) => state.step);
  const amount = useDepositStore((state) => state.amount);
  const selectedMethod = useDepositStore((state) => state.selectedMethod);

  const method = MOCK_DEPOSIT_METHODS.find((candidate) => candidate.id === selectedMethod) ?? MOCK_DEPOSIT_METHODS[0];
  const parsed = parseMoneyInput(amount);

  const submit = () => {
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
  };

  /**
   * Unlike Send money, there is no client-side over-balance check here: the
   * amount is going *into* this balance, and there is no real external-source
   * limit to check it against (checking the destination's own balance would
   * block completely ordinary top-ups). The gateway's `insufficient-funds`
   * result at payment-review remains the only check, same as before this step
   * existed.
   */
  const canAdvance = step === 1 ? selectedMethod !== "" : parsed !== null && parsed.amount > 0;

  return {
    ...base,
    ...createAmountDraft(amount, depositActions.setAmount),
    step,
    canAdvance,
    /** Step 1's "Continue" skips straight to `fund-wallet` for an inbound method — Step 2 never renders for it. */
    advance: () => {
      if (step === 1) {
        if (method.inbound) submit();
        else depositActions.nextStep();
        return;
      }
      submit();
    },
    methodGroups: [
      { label: "Instant", methods: MOCK_DEPOSIT_METHODS.filter((candidate) => candidate.inbound !== true) },
      { label: "Manual", methods: MOCK_DEPOSIT_METHODS.filter((candidate) => candidate.inbound === true) },
    ],
    selectedMethod,
    selectMethod: depositActions.selectMethod,
    step1ActionLabel: method.inbound ? "Get account number" : "Continue",
    feeLabel: isZero(method.fee) ? "No fee" : formatMoney(method.fee),
    arrivalLabel: method.arrivalLabel,
    submit,
    back: () => (step === 1 ? base.back() : depositActions.previousStep()),
  };
}

export type PaymentsViewModel = MoneyBase & {
  scheduledLabels: readonly { id: string; glyph: string; name: string; when: string; amountLabel: string }[];
  billers: readonly Biller[];
  loadOperators: readonly LoadOperator[];
  /** Search box state, backed by the session store so it survives tab switches. */
  searchQuery: string;
  setSearchQuery(value: string): void;
  /** Search-filtered catalog, grouped by category in `BILLER_CATEGORY_ORDER`. */
  catalog: readonly BillerGroup[];
  /** Favorited billers, for the pinned section above the grouped catalog. */
  favorites: readonly BillerRowVM[];
  /** True when favorites should render as their own section (none hidden by a search). */
  showFavorites: boolean;
  /** True when the search matched nothing, so the screen can show an empty state. */
  emptySearch: boolean;
  toggleFavorite(id: string): void;
  scanToPay(): void;
  showMyQr(): void;
  payBill(billerId: string): void;
  buyLoad(operatorId: string): void;
  openAutopay(id: string): void;
};

/** A catalog row with its favorite state resolved, so the view renders, not derives. */
export type BillerRowVM = Biller & { favorited: boolean };

export type BillerGroup = {
  category: BillerCategory;
  label: string;
  billers: readonly BillerRowVM[];
};

const withFavoriteState = (billers: readonly Biller[], favoriteBillerIds: readonly string[]): readonly BillerRowVM[] =>
  billers.map((biller) => ({ ...biller, favorited: favoriteBillerIds.includes(biller.id) }));

export function usePaymentsViewModel(): PaymentsViewModel {
  const navigation = useNavigation();
  const enrollments = useBillsStore((state) => state.enrollments);
  const searchQuery = useBillerCatalogStore((state) => state.searchQuery);
  const favoriteBillerIds = useBillerCatalogStore((state) => state.favoriteBillerIds);

  const matched = searchBillers(MOCK_BILLERS, searchQuery);
  const favorites = withFavoriteState(MOCK_BILLERS, favoriteBillerIds).filter((biller) => biller.favorited);

  return {
    ...useMoneyBase(),
    scanToPay: () => navigation.navigate("qr-scan"),
    showMyQr: () => navigation.navigate("qr-receive"),
    billers: MOCK_BILLERS,
    loadOperators: MOCK_LOAD_OPERATORS,
    searchQuery,
    setSearchQuery: billerCatalogActions.setSearchQuery,
    catalog: BILLER_CATEGORY_ORDER.flatMap((category) => {
      const billers = withFavoriteState(
        matched.filter((biller) => biller.category === category),
        favoriteBillerIds,
      );
      return billers.length === 0 ? [] : [{ category, label: BILLER_CATEGORY_LABELS[category], billers }];
    }),
    favorites,
    showFavorites: favorites.length > 0 && searchQuery.trim() === "",
    emptySearch: searchQuery.trim() !== "" && matched.length === 0,
    toggleFavorite: billerCatalogActions.toggleFavorite,
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
    buyLoad: (operatorId: string) => {
      buyloadActions.startLoad(operatorId);
      navigation.navigate("load-entry");
    },
    openAutopay: (id: string) => {
      billsActions.selectEnrollment(id);
      navigation.navigate("autopay-detail");
    },
  };
}
