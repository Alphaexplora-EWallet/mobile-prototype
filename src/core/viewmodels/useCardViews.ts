import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { CardView } from "../domain/card";
import { formatMoney } from "../money/format";
import { deriveCardViews } from "../domain/card";
import { useWalletStore } from "../stores/wallet.store";
import { isRewardUnlocked, useQuestStore } from "../stores/quest.store";

/**
 * One memoized derivation, where there used to be five independent copies of
 * `getCardViews(frozenCards, rewardUnlocked, cardStyleApplied)` across Home,
 * Wallet, Transfer, Deposit and Payments.
 */
/** A card plus the strings a view needs. Views never format money themselves. */
export type CardPresentation = CardView & { balanceLabel: string };

export function useCardViews(): readonly CardPresentation[] {
  const cards = useWalletStore((state) => state.cards);
  const frozen = useWalletStore(useShallow((state) => state.frozen));
  const rewardUnlocked = useQuestStore((state) => isRewardUnlocked(state.phase));
  const styleApplied = useQuestStore((state) => state.rewardStyleApplied);

  return useMemo(
    () =>
      deriveCardViews({ cards, frozen, rewardUnlocked, styleApplied }).map((card) => ({
        ...card,
        balanceLabel: formatMoney(card.balance),
      })),
    [cards, frozen, rewardUnlocked, styleApplied],
  );
}

/** The card the user is currently acting on. */
export function useSelectedCard(): CardPresentation {
  const cards = useCardViews();
  const selectedCardId = useWalletStore((state) => state.selectedCardId);
  return cards.find((card) => card.id === selectedCardId) ?? cards[0];
}
