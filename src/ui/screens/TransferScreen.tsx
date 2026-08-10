import { useState } from "react";
import { getCardViews } from "@/core/data/cardViews";
import { MOCK_RECIPIENTS } from "@/core/data/mock/payments.mock";
import { SIMULATED_NOTE } from "@/core/domain/simulation";
import { Icon } from "../primitives/Icon";
import { PageBar } from "../layout/PageBar";
import { SourcePicker } from "../cards/SourcePicker";
import { AmountField } from "../money/AmountField";
import type { MoneyScreenProps } from "./moneyScreenProps";

export function TransferScreen(props: MoneyScreenProps) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState(MOCK_RECIPIENTS[0].initials);
  const [note, setNote] = useState("");
  const cards = getCardViews(props.frozenCards, props.rewardUnlocked, props.cardStyleApplied);
  const source = cards.find((card) => card.id === props.selectedCard) ?? cards[0];

  return (
    <div className="onboarding-page money-page transfer-page">
      <PageBar title="Send money" onBack={props.onBack} optionsLabel="Transfer options" />

      <SourcePicker label="From" cards={cards} selected={source.id} onSelect={props.onSelectCard} />
      <AmountField label="Amount to send" value={amount} onChange={setAmount} available={source.balance} />

      <section className="money-field">
        <span className="field-label">Send to</span>
        <div className="recipient-row">
          {MOCK_RECIPIENTS.map((person) => (
            <button
              className={`recipient-chip ${recipient === person.initials ? "is-selected" : ""}`}
              type="button"
              key={person.initials}
              onClick={() => setRecipient(person.initials)}
              aria-pressed={recipient === person.initials}
            >
              <span aria-hidden="true">{person.initials}</span>
              <strong>{person.name}</strong>
              <small>{person.handle}</small>
            </button>
          ))}
          <button
            className="recipient-chip recipient-add"
            type="button"
            onClick={() => props.onSimulate("New recipient")}
          >
            <span aria-hidden="true">
              <Icon name="plus" />
            </span>
            <strong>New</strong>
            <small>Add recipient</small>
          </button>
        </div>
      </section>

      <label className="money-note">
        <span className="field-label">Note (optional)</span>
        <span className="input-shell">
          <Icon name="mail" />
          <input
            type="text"
            placeholder="What is this for?"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </span>
      </label>

      <div className="summary-strip">
        <Icon name="bolt" />
        <span>
          <strong>Fee ₱0.00</strong>
          <small>Arrives instantly to FIN-A wallets</small>
        </span>
      </div>

      <div className="money-actions">
        <button className="primary-button" type="button" onClick={() => props.onSimulate("Send money")}>
          Continue
        </button>
        <p className="prototype-note">{SIMULATED_NOTE}</p>
      </div>
    </div>
  );
}
