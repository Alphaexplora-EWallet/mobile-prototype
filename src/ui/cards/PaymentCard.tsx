import { useEffect, useState } from "react";
import type { CardView } from "@/core/domain/card";
import { maskCardNumber } from "@/core/domain/card";
import { MOCK_CARDHOLDER } from "@/core/data/mock/cards.mock";
import { Icon } from "../primitives/Icon";
import { BrandMark } from "../layout/BrandMark";
import { CardFace } from "./CardFace";

export function PaymentCard({
  card,
  selected,
  onClick,
  onFreeze,
}: {
  card: CardView;
  selected: boolean;
  onClick: () => void;
  onFreeze: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!selected) {
      setFlipped(false);
      setRevealed(false);
      setAuthOpen(false);
    }
  }, [selected]);

  useEffect(() => {
    if (!revealed) return;
    const privacyTimer = window.setTimeout(() => setRevealed(false), 20_000);
    return () => window.clearTimeout(privacyTimer);
  }, [revealed]);

  useEffect(() => {
    const hideSensitiveDetails = () => {
      if (document.hidden) setRevealed(false);
    };
    const hideOnBlur = () => setRevealed(false);
    document.addEventListener("visibilitychange", hideSensitiveDetails);
    window.addEventListener("blur", hideOnBlur);
    return () => {
      document.removeEventListener("visibilitychange", hideSensitiveDetails);
      window.removeEventListener("blur", hideOnBlur);
    };
  }, []);

  useEffect(() => {
    if (!authOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAuthOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [authOpen]);

  const toggleFlip = () => {
    if (!selected) onClick();
    setFlipped((value) => {
      if (value) {
        setRevealed(false);
        setAuthOpen(false);
      }
      return !value;
    });
  };

  const toggleFreeze = () => {
    if (!selected) onClick();
    onFreeze();
  };

  return (
    <article className={`payment-card-shell ${selected ? "is-selected" : ""}`}>
      <div className={`payment-card-flipper ${flipped ? "is-flipped" : ""}`}>
        <section className={`payment-card payment-card-front payment-card-${card.variant}`} aria-hidden={flipped}>
          <CardFace card={card} />
          <button
            className="card-select-surface"
            type="button"
            onClick={onClick}
            aria-label={`${card.displayLabel} card ending in ${card.last4}${selected ? ", selected" : ""}`}
            aria-pressed={selected}
            tabIndex={flipped ? -1 : 0}
          />

          <aside className="card-utility-rail" aria-label={`${card.displayLabel} quick actions`}>
            <button
              type="button"
              onClick={toggleFreeze}
              tabIndex={flipped ? -1 : 0}
              aria-pressed={card.frozen}
              aria-label={`${card.frozen ? "Unfreeze" : "Freeze"} ${card.displayLabel} card`}
            >
              <Icon name="snow" />
              <span>{card.frozen ? "Unfreeze" : "Freeze"}</span>
            </button>
            <i />
            <button
              type="button"
              onClick={toggleFlip}
              tabIndex={flipped ? -1 : 0}
              aria-label={`View secure details for ${card.displayLabel} card`}
            >
              <Icon name="eye" />
              <span>Details</span>
            </button>
          </aside>
        </section>

        <section className="payment-card payment-card-back" aria-hidden={!flipped}>
          <div className="card-back-top">
            <span className="card-back-number" aria-live="polite">
              {revealed ? card.fullNumber : maskCardNumber(card.last4)}
            </span>
            <button
              className="card-reveal-button"
              type="button"
              onClick={() => (revealed ? setRevealed(false) : setAuthOpen(true))}
              tabIndex={flipped ? 0 : -1}
              aria-label={revealed ? "Hide card number" : "Reveal full card number"}
              aria-pressed={revealed}
            >
              <Icon name={revealed ? "eye-off" : "eye"} />
            </button>
          </div>
          <div className="card-back-meta">
            <span>
              <small>Account opened</small>
              <strong>{MOCK_CARDHOLDER.openedLabel}</strong>
            </span>
            <span>
              <small>Expires</small>
              <strong>{card.expiry}</strong>
            </span>
            <span>
              <small>Security code</small>
              <strong>{revealed ? MOCK_CARDHOLDER.securityCode : "•••"}</strong>
            </span>
          </div>
          <div className="signature-line">
            <small>Signature</small>
            <strong>{MOCK_CARDHOLDER.name}</strong>
          </div>
          <div className="card-back-brand">
            <span>{card.displayLabel}</span>
            <BrandMark compact light />
          </div>

          {authOpen && (
            <div className="card-auth-panel" role="dialog" aria-modal="true" aria-label="Confirm your identity">
              <strong>Confirm it’s you</strong>
              <small>This prototype simulates biometric verification.</small>
              <div>
                <button
                  autoFocus
                  type="button"
                  onClick={() => {
                    setAuthOpen(false);
                    setRevealed(true);
                  }}
                >
                  Use demo Face ID
                </button>
                <button type="button" onClick={() => setAuthOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {selected && (
        <span className="selected-check" aria-label="Selected card">
          <Icon name="check" />
        </span>
      )}

      <button className="card-flip-button" type="button" onClick={toggleFlip} aria-pressed={flipped}>
        <Icon name="rotate" /> {flipped ? "Show card front" : "Flip to card details"}
      </button>
    </article>
  );
}
