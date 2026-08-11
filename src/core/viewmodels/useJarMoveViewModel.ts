import { SIMULATED_NOTE } from "../domain/simulation";
import { formatMoney, parseMoneyInput } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { jarActions, useJarStore } from "../stores/jar.store";
import { paymentActions } from "../stores/payment.store";
import { useWalletStore } from "../stores/wallet.store";
import { useCardViews } from "./useCardViews";
import { MOCK_AMOUNT_PRESETS } from "../data/mock/payments.mock";

/**
 * The one screen both jar directions share: an amount and the wallet card on
 * the other side of the move. Direction comes from the draft store (set by the
 * jar card face), so this screen needs no route params.
 */
export function useJarMoveViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const cards = useCardViews();
  const direction = useJarStore((state) => state.direction);
  const amount = useJarStore((state) => state.amount);
  const cardId = useJarStore((state) => state.cardId);
  const jarOpened = useWalletStore((state) => state.jar.opened);
  const jarBalance = useWalletStore((state) => state.jar.balance);

  const isIn = direction === "in";
  const card = cards.find((candidate) => candidate.id === cardId) ?? cards[0];
  const parsed = parseMoneyInput(amount);

  const presets = MOCK_AMOUNT_PRESETS.map((preset) => ({
    id: formatMoney(preset, { symbol: false, fractionDigits: 0 }),
    label: formatMoney(preset, { fractionDigits: 0 }),
  }));
  const selectedPresetId =
    MOCK_AMOUNT_PRESETS.reduce<string | null>(
      (found, preset, index) => found ?? (parsed && parsed.amount === preset.amount ? presets[index].id : null),
      null,
    ) ?? null;

  return {
    title: isIn ? "Move into jar" : "Move out of jar",
    /** The picker names the other side: where the money comes from or goes to. */
    pickerLabel: isIn ? "From" : "To",
    cards,
    selectedCardId: card.id,
    selectCard: jarActions.selectCard,
    amount,
    setAmount: jarActions.setAmount,
    presets,
    selectedPresetId,
    selectPreset: jarActions.setAmount,
    /** What the move is capped by: the card's balance going in, the jar's out. */
    availableLabel: isIn ? card.balanceLabel : formatMoney(jarBalance),
    jarBalanceLabel: formatMoney(jarBalance),
    jarDetail: isIn
      ? "Moves instantly, free, and outside your spending limit"
      : "Back to your wallet, free and instant",
    actionLabel: isIn ? "Move into jar" : "Move out of jar",
    canContinue: jarOpened && Boolean(parsed && parsed.amount > 0),
    simulatedNote: SIMULATED_NOTE,
    submit: () => {
      if (!jarOpened || !parsed || parsed.amount <= 0) return;
      paymentActions.start(
        isIn
          ? {
              kind: "jar-in",
              sourceCardId: card.id,
              sourceLabel: `${card.displayLabel} •••• ${card.last4}`,
              amount: parsed,
            }
          : {
              kind: "jar-out",
              destinationCardId: card.id,
              destinationLabel: `${card.displayLabel} •••• ${card.last4}`,
              amount: parsed,
            },
        gateway.nextIdempotencyKey(),
      );
      navigation.navigate("payment-review");
    },
    back: navigation.goBack,
  };
}
