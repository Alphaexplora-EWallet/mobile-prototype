import type { CardId } from "@/core/domain/card";

export type MoneyScreenProps = {
  selectedCard: CardId;
  onSelectCard: (card: CardId) => void;
  frozenCards: Record<CardId, boolean>;
  rewardUnlocked: boolean;
  cardStyleApplied: boolean;
  onBack: () => void;
  onSimulate: (action: string) => void;
};
