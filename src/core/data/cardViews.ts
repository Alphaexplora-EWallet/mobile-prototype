import type { CardId, CardView } from "../domain/card";
import { deriveCardViews } from "../domain/card";
import { MOCK_CARDS } from "./mock/cards.mock";

/**
 * Bridge over the pure derivation while App still owns wallet state.
 * Replaced by a useCardViews() hook reading the wallet store once stores land.
 */
export function getCardViews(
  frozen: Record<CardId, boolean>,
  rewardUnlocked: boolean,
  cardStyleApplied: boolean,
): CardView[] {
  return deriveCardViews({ cards: MOCK_CARDS, frozen, rewardUnlocked, styleApplied: cardStyleApplied });
}
