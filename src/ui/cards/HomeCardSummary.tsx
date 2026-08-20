import type { CardPresentation } from "@/core/viewmodels/useCardViews";
import { BrandMark } from "../layout/BrandMark";

/**
 * A standalone illustration of the selected card for the Home screen — the
 * reference mock's card face is its own flat design, not the Wallet screen's
 * physical-card treatment (chip, contactless glyph, flip). Deliberately not a
 * wrapped CardFace: that reuse was tried first and didn't match 1:1.
 */
export function HomeCardSummary({ card, onPress }: { card: CardPresentation; onPress: () => void }) {
  return (
    <button
      className="home-card-summary"
      type="button"
      onClick={onPress}
      aria-label={`${card.displayLabel} card, ending in ${card.last4}. Open Wallet`}
    >
      <span className="home-card-summary-top">
        <BrandMark compact light />
        <b className="home-card-summary-visa">VISA</b>
      </span>
      <span className="home-card-summary-label">Wallet balance</span>
      <span className="home-card-summary-number">**** **** **** {card.last4}</span>
      <span className="home-card-summary-bottom">
        <strong>{card.holderName}</strong>
        <span>{card.expiry}</span>
      </span>
    </button>
  );
}
