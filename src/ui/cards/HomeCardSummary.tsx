import type { CardPresentation } from "@/core/viewmodels/useCardViews";
import { CardFace } from "./CardFace";

/**
 * A static, non-flipping preview of the selected card for the Home screen.
 * The Wallet screen owns flip/freeze/stacking via CardDeck/CardFlipper — this
 * is deliberately dumber, a single frame that taps through to Wallet.
 */
export function HomeCardSummary({ card, onPress }: { card: CardPresentation; onPress: () => void }) {
  return (
    <button
      className={`home-card-summary payment-card-${card.variant}`}
      type="button"
      onClick={onPress}
      aria-label={`${card.displayLabel} card, ending in ${card.last4}. Open Wallet`}
    >
      <CardFace card={card} />
    </button>
  );
}
