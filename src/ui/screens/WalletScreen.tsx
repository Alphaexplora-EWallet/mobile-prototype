import type { CardId } from "@/core/domain/card";
import { getCardViews } from "@/core/data/cardViews";
import type { Screen } from "@/core/navigation/screens";
import { Icon } from "../primitives/Icon";
import { ControlRow } from "../primitives/ControlRow";
import { LinkRow } from "../primitives/LinkRow";
import { Toggle } from "../primitives/Toggle";
import { PaymentCard } from "../cards/PaymentCard";

export type WalletProps = {
  selectedCard: CardId;
  onSelectCard: (card: CardId) => void;
  limitSetup: boolean;
  rewardUnlocked: boolean;
  cardStyleApplied: boolean;
  frozenCards: Record<CardId, boolean>;
  onlinePayments: boolean;
  atmWithdrawals: boolean;
  onFrozenChange: (card: CardId, value: boolean) => void;
  onOnlineChange: (value: boolean) => void;
  onAtmChange: (value: boolean) => void;
  onConfirmLimit: () => void;
  onCancelLimit: () => void;
  onNavigate: (screen: Screen) => void;
};

export function WalletScreen(props: WalletProps) {
  const cards = getCardViews(props.frozenCards, props.rewardUnlocked, props.cardStyleApplied);
  const selectedNumber = cards.find((card) => card.id === props.selectedCard)?.last4 ?? cards[0].last4;
  return (
    <div className="tab-page wallet-page">
      <header className="centered-app-bar page-app-bar">
        <span className="app-bar-spacer" />
        <strong>{props.limitSetup ? "Set spending limit" : "My Cards"}</strong>
        <button className="icon-button clear-button" type="button" aria-label="Card options">
          <Icon name="more" />
        </button>
      </header>

      {props.limitSetup && (
        <div className="quest-context-banner">
          <Icon name="target" />
          <span>
            <strong>Quest step</strong>
            <small>Set a limit on your main card to continue.</small>
          </span>
        </div>
      )}

      <section className="card-stack" aria-label="Your cards">
        {cards.map((card) => (
          <PaymentCard
            key={card.id}
            card={card}
            selected={props.selectedCard === card.id}
            onClick={() => props.onSelectCard(card.id)}
            onFreeze={() => props.onFrozenChange(card.id, !props.frozenCards[card.id])}
          />
        ))}
      </section>

      <button className="add-card-button" type="button">
        <Icon name="plus" /> Add card
      </button>

      {!props.limitSetup && (
        <section className="money-field wallet-move-money">
          <h2>Move money</h2>
          <div className="control-list">
            <LinkRow
              icon="send"
              title="Send money"
              detail={`From •••• ${selectedNumber}`}
              onClick={() => props.onNavigate("transfer")}
            />
            <LinkRow
              icon="arrow-down"
              title="Add money"
              detail="Top up this card"
              onClick={() => props.onNavigate("deposit")}
            />
            <LinkRow
              icon="receipt"
              title="Pay a bill"
              detail="Billers and QR payments"
              onClick={() => props.onNavigate("payments")}
            />
          </div>
        </section>
      )}

      <section className={`controls-section ${props.limitSetup ? "is-highlighted" : ""}`}>
        <h2>Controls for •••• {selectedNumber}</h2>
        <div className="control-list">
          <ControlRow
            icon="snow"
            title="Freeze card"
            detail="Temporarily block your card"
            trailing={
              <Toggle
                checked={props.frozenCards[props.selectedCard]}
                onChange={(value) => props.onFrozenChange(props.selectedCard, value)}
                label="Freeze card"
              />
            }
          />
          <ControlRow
            icon="globe"
            title="Online payments"
            detail="Enable online transactions"
            trailing={<Toggle checked={props.onlinePayments} onChange={props.onOnlineChange} label="Online payments" />}
          />
          <ControlRow
            icon="bank"
            title="ATM withdrawals"
            detail="Enable for cash withdrawals"
            trailing={<Toggle checked={props.atmWithdrawals} onChange={props.onAtmChange} label="ATM withdrawals" />}
          />
          <ControlRow
            icon="limit"
            title="Spending limit"
            detail="Daily limit for this card"
            trailing={
              <strong className="limit-amount">
                ₱3,000 <small>/ day</small>
              </strong>
            }
          />
        </div>
      </section>

      {props.limitSetup && (
        <div className="wallet-limit-actions">
          <button className="primary-button" type="button" onClick={props.onConfirmLimit}>
            Confirm ₱3,000 limit
          </button>
          <button className="text-button" type="button" onClick={props.onCancelLimit}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
