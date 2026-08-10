import type { CardView } from "@/core/domain/card";
import { cardTag } from "@/core/domain/card";
import { ARTWORK } from "../assets";
import { BrandMark } from "../layout/BrandMark";

export function CardFace({ card }: { card: CardView }) {
  return (
    <>
      {card.artworkId && <img className="card-artwork" src={ARTWORK[card.artworkId]} alt="" />}
      <span className="card-overlay" />
      <span className="card-front-content">
        <span className="card-top">
          <BrandMark compact light={card.variant === "teal"} preserveInk={card.variant === "sunset"} />
          <small>debit</small>
        </span>
        <span className="card-middle">
          <span className="chip" />
          <span className="contactless">)))</span>
        </span>
        <span className="card-data-row">
          <span className="card-number">•••• {card.last4}</span>
          <span className="card-expiry">
            <small>
              Valid
              <br />
              thru
            </small>
            <strong>{card.expiry}</strong>
          </span>
        </span>
        <span className="card-bottom">
          <strong>{card.holderName}</strong>
          <b>VISA</b>
        </span>
        <span className="card-tag">{cardTag(card)}</span>
      </span>
    </>
  );
}
