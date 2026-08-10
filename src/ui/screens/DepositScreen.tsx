import { useState } from "react";
import { getCardViews } from "@/core/data/cardViews";
import { MOCK_DEPOSIT_METHODS } from "@/core/data/mock/payments.mock";
import { SIMULATED_NOTE } from "@/core/domain/simulation";
import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";
import { PageBar } from "../layout/PageBar";
import { SourcePicker } from "../cards/SourcePicker";
import { AmountField } from "../money/AmountField";
import type { MoneyScreenProps } from "./moneyScreenProps";

export function DepositScreen(props: MoneyScreenProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(MOCK_DEPOSIT_METHODS[0].id);
  const cards = getCardViews(props.frozenCards, props.rewardUnlocked, props.cardStyleApplied);
  const destination = cards.find((card) => card.id === props.selectedCard) ?? cards[0];

  return (
    <div className="onboarding-page money-page deposit-page">
      <PageBar title="Add money" onBack={props.onBack} optionsLabel="Deposit options" />

      <SourcePicker label="To" cards={cards} selected={destination.id} onSelect={props.onSelectCard} />
      <AmountField label="Amount to add" value={amount} onChange={setAmount} available={destination.balance} />

      <section className="money-field">
        <span className="field-label">Choose a method</span>
        <div className="control-list">
          {MOCK_DEPOSIT_METHODS.map((item) => (
            <LinkRow
              key={item.id}
              icon={item.icon}
              title={item.title}
              detail={item.detail}
              selected={method === item.id}
              onClick={() => setMethod(item.id)}
            />
          ))}
        </div>
      </section>

      <div className="summary-strip">
        <Icon name="arrow-down" />
        <span>
          <strong>No fee</strong>
          <small>Arrives in seconds once confirmed</small>
        </span>
      </div>

      <div className="money-actions">
        <button className="primary-button" type="button" onClick={() => props.onSimulate("Add money")}>
          Add money
        </button>
        <p className="prototype-note">{SIMULATED_NOTE}</p>
      </div>
    </div>
  );
}
