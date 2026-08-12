import type { AnimationEvent as ReactAnimationEvent } from "react";
import type { CardId } from "@/core/domain/card";
import type { CardPresentation } from "@/core/viewmodels/useCardViews";
import { useCardPrivacy } from "@/core/viewmodels/useCardPrivacy";
import { Icon } from "../primitives/Icon";
import { CardFace } from "./CardFace";
import { CardFlipper } from "./CardFlipper";

export function CardDeck({
  front,
  rear,
  stackingId,
  onPromote,
  onFreeze,
  onEndStacking,
}: {
  front: CardPresentation;
  rear: CardPresentation | null;
  stackingId: CardId | null;
  onPromote: (id: CardId) => void;
  onFreeze: (id: CardId) => void;
  onEndStacking: () => void;
}) {
  const privacy = useCardPrivacy(true, () => {});
  const isStacking = stackingId === front.id;

  // The front slot is always selected by construction; closing an open flip
  // here (rather than relying on useCardPrivacy's deselect-reset, which never
  // fires since `selected` is hardcoded true) is what keeps a promoted card
  // from ever appearing already flipped open.
  const promote = (id: CardId) => {
    if (privacy.flipped) privacy.toggleFlip();
    onPromote(id);
  };

  const finishPromotion = (event: ReactAnimationEvent<HTMLDivElement>) => {
    if (event.animationName === "deck-card-stack-forward") onEndStacking();
  };

  return (
    <>
      <div className={`card-deck-frame ${stackingId ? "is-switching" : ""}`} aria-busy={stackingId ? true : undefined}>
        {rear && (
          <button
            className="deck-card is-rear"
            type="button"
            onClick={() => promote(rear.id)}
            aria-label={`Bring ${rear.displayLabel} card to front`}
            aria-disabled={stackingId ? true : undefined}
          >
            <CardFace card={rear} />
          </button>
        )}

        <div
          className={`deck-card is-front ${isStacking ? "is-stacking" : ""}`}
          onAnimationEnd={isStacking ? finishPromotion : undefined}
        >
          <CardFlipper card={front} privacy={privacy} onFreeze={() => onFreeze(front.id)} />
        </div>

        {rear && (
          <button
            className="deck-next"
            type="button"
            onClick={() => promote(rear.id)}
            aria-label={`Show next card, ${rear.displayLabel}`}
            aria-disabled={stackingId ? true : undefined}
          >
            <Icon name="chevron-right" />
          </button>
        )}
      </div>

      <button className="card-flip-button" type="button" onClick={privacy.toggleFlip} aria-pressed={privacy.flipped}>
        <Icon name="rotate" /> {privacy.flipped ? "Show card front" : "Flip to card details"}
      </button>
    </>
  );
}
