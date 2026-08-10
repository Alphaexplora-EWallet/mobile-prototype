export type CardId = "main" | "travel";
export type CardVariant = "teal" | "sunset";

/**
 * A token, not a URL. On the web an imported image resolves to a string; under
 * React Native the same import yields an opaque module id. Neither may leak
 * into the domain, so cards name their artwork and the view layer resolves it
 * (see ui/assets/index.ts).
 */
export type CardArtworkId = "sunset-jeepney";

export type CardDefinition = {
  id: CardId;
  /** Last four digits. Kept as a string because it is an identifier, not a number. */
  last4: string;
  fullNumber: string;
  expiry: string;
  securityCode: string;
  holderName: string;
  /** When the account behind this card was opened. */
  openedLabel: string;
  /**
   * Display string today (e.g. "₱24,680.50"). Becomes Money in the centavos
   * migration, which is the last step precisely because it changes output.
   */
  balance: string;
  label: string;
  /** Shown instead of `label` once the quest reward style is applied. */
  rewardLabel?: string;
  variant: CardVariant;
  artworkId?: CardArtworkId;
};

/** A card plus the state that decides how it presents right now. */
export type CardView = CardDefinition & {
  /** `rewardLabel` when the reward style is applied, otherwise `label`. */
  displayLabel: string;
  frozen: boolean;
  unlocked: boolean;
};

export type DeriveCardViewsInput = {
  cards: readonly CardDefinition[];
  frozen: Readonly<Record<CardId, boolean>>;
  rewardUnlocked: boolean;
  styleApplied: boolean;
};

/**
 * The single definition of how stored cards become presentable ones. This was
 * previously re-derived independently at five call sites.
 */
export function deriveCardViews({ cards, frozen, rewardUnlocked, styleApplied }: DeriveCardViewsInput): CardView[] {
  return cards.map((card) => ({
    ...card,
    displayLabel: card.id === "travel" && styleApplied ? (card.rewardLabel ?? card.label) : card.label,
    frozen: frozen[card.id] ?? false,
    unlocked: card.id === "main" || rewardUnlocked,
  }));
}

/** The tag printed across the face of a card. */
export function cardTag(card: CardView): string {
  if (card.frozen) return "Frozen";
  return card.unlocked ? card.displayLabel : "Locked reward";
}

export const maskCardNumber = (last4: string) => `•••• •••• •••• ${last4}`;

/**
 * Masks an already-formatted amount. Operates on the formatted string rather
 * than the value so the masked output keeps the shape of the real one.
 */
export function maskBalance(balance: string): string {
  return balance.replace(/\d/g, "•");
}
