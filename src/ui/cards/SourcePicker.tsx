import type { CardId, CardView } from "@/core/domain/card";
import { Icon } from "../primitives/Icon";

export function SourcePicker({
  label,
  cards,
  selected,
  onSelect,
}: {
  label: string;
  cards: CardView[];
  selected: CardId;
  onSelect: (card: CardId) => void;
}) {
  return (
    <section className="money-field">
      <span className="field-label">{label}</span>
      <div className="source-picker" role="group" aria-label={`${label} account`}>
        {cards.map((card) => (
          <button
            className={`source-option ${selected === card.id ? "is-selected" : ""}`}
            type="button"
            key={card.id}
            onClick={() => onSelect(card.id)}
            aria-pressed={selected === card.id}
          >
            <span className="source-option-top">
              <Icon name="card" />
              <strong>{card.displayLabel}</strong>
            </span>
            <small>•••• {card.last4}</small>
            <b>{card.balance}</b>
            {card.frozen && <em>Frozen</em>}
          </button>
        ))}
      </div>
    </section>
  );
}
