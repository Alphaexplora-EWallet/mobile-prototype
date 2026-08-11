import { useMemo } from "react";
import { findBank, RAIL_PRICING } from "../data/mock/banks.mock";
import { MOCK_CASHOUT_ACCOUNTS } from "../data/mock/payments.mock";
import type { IconName } from "../domain/icons";
import type { Recipient } from "../domain/payments";
import { defaultRailFor } from "../domain/rails";
import { SIMULATED_NOTE } from "../domain/simulation";
import { formatMoney, parseMoneyInput } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { cashOutActions, useCashOutStore } from "../stores/cashout.store";
import { paymentActions } from "../stores/payment.store";
import { walletActions } from "../stores/wallet.store";
import { createAmountDraft } from "./useMoneyMovementViewModel";
import { useCardViews, useSelectedCard } from "./useCardViews";

/**
 * The cash-out entry screen: pick a source card, type an amount, choose which
 * saved bank account the money lands in, then hand off to the shared
 * review → confirm (PIN) → receipt pipeline as a `cash-out` intent.
 *
 * The account list is a fixture, not a gateway call: these accounts were
 * linked and verified earlier, so there is nothing to load or inquire about.
 */
export function useCashOutViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const cards = useCardViews();
  const source = useSelectedCard();
  const amount = useCashOutStore((state) => state.amount);
  const selectedAccountId = useCashOutStore((state) => state.selectedAccountId);

  const parsed = useMemo(() => parseMoneyInput(amount), [amount]);
  const account = MOCK_CASHOUT_ACCOUNTS.find((candidate) => candidate.id === selectedAccountId) ?? null;
  const bank = account ? findBank(account.bankCode) : null;
  const rail = bank ? defaultRailFor(bank) : null;
  const pricing = rail ? RAIL_PRICING[rail] : null;

  const canContinue = Boolean(account && rail && parsed && parsed.amount > 0);

  const review = () => {
    if (!account || !bank || !rail || !parsed || parsed.amount <= 0) return;
    /** The saved account in the shape the shared pipeline already renders. */
    const recipient: Recipient = {
      id: account.id,
      initials: initialsOf(account.label),
      name: account.label,
      handle: account.handle,
      accountNumber: account.accountNumber,
      bankCode: account.bankCode,
    };
    paymentActions.start(
      {
        kind: "cash-out",
        sourceCardId: source.id,
        sourceLabel: `${source.displayLabel} •••• ${source.last4}`,
        account: recipient,
        rail,
        amount: parsed,
      },
      gateway.nextIdempotencyKey(),
    );
    navigation.navigate("payment-review");
  };

  return {
    title: "Cash out",
    intro: "Move money from your FIN-A wallet to a bank account you have linked.",
    cards,
    source,
    selectCard: walletActions.selectCard,
    availableLabel: source.balanceLabel,
    ...createAmountDraft(amount, cashOutActions.setAmount),
    accounts: MOCK_CASHOUT_ACCOUNTS.map((candidate) => ({
      id: candidate.id,
      icon: "bank" as IconName,
      title: candidate.label,
      detail: `${candidate.handle} · ${candidate.accountName}`,
      selected: candidate.id === selectedAccountId,
    })),
    selectAccount: cashOutActions.selectAccount,
    feeLabel: pricing ? `Fee ${formatMoney(pricing.fee)}` : "",
    arrivalLabel: pricing?.arrivalLabel ?? "",
    limitLabel: pricing?.perTransaction ? `Up to ${formatMoney(pricing.perTransaction)} per transfer` : "",
    canContinue,
    simulatedNote: SIMULATED_NOTE,
    review,
    back: navigation.goBack,
  };
}

/** "BPI Savings" → "BS". Falls back to one letter for a single word. */
const initialsOf = (label: string): string => {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
};
