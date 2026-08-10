import { getCardViews } from "@/core/data/cardViews";
import { MOCK_BILLERS, MOCK_SCHEDULED_PAYMENTS } from "@/core/data/mock/payments.mock";
import { SIMULATED_NOTE } from "@/core/domain/simulation";
import type { Screen } from "@/core/navigation/screens";
import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";
import { PageBar } from "../layout/PageBar";
import type { MoneyScreenProps } from "./moneyScreenProps";

export function PaymentsScreen(props: MoneyScreenProps & { onNavigate: (screen: Screen) => void }) {
  const cards = getCardViews(props.frozenCards, props.rewardUnlocked, props.cardStyleApplied);
  const source = cards.find((card) => card.id === props.selectedCard) ?? cards[0];

  return (
    <div className="tab-page money-page payments-page">
      <PageBar title="Pay" optionsLabel="Payment options" />

      <button className="pay-scan-card" type="button" onClick={() => props.onSimulate("Pay with QR")}>
        <span className="pay-scan-icon">
          <Icon name="qr" />
        </span>
        <span className="pay-scan-copy">
          <strong>Scan to pay</strong>
          <small>Point your camera at any QR Ph code</small>
        </span>
        <Icon name="chevron-right" />
      </button>

      <section className="money-field">
        <span className="field-label">Move money</span>
        <div className="control-list">
          <LinkRow
            icon="send"
            title="Send money"
            detail={`From •••• ${source.last4}`}
            onClick={() => props.onNavigate("transfer")}
          />
          <LinkRow
            icon="arrow-down"
            title="Add money"
            detail="Cash in from bank, card, or counter"
            onClick={() => props.onNavigate("deposit")}
          />
        </div>
      </section>

      <section className="money-field">
        <span className="field-label">Pay a bill</span>
        <div className="control-list">
          {MOCK_BILLERS.map((biller) => (
            <LinkRow
              key={biller.id}
              icon={biller.icon}
              title={biller.name}
              detail={biller.detail}
              meta={biller.due}
              onClick={() => props.onSimulate(`Pay ${biller.name}`)}
            />
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2>Scheduled</h2>
        <div className="transaction-list">
          {MOCK_SCHEDULED_PAYMENTS.map((payment) => (
            <button
              type="button"
              className="transaction-row"
              key={payment.name}
              onClick={() => props.onSimulate(payment.name)}
            >
              <span className="transaction-icon">{payment.glyph}</span>
              <span className="transaction-copy">
                <strong>{payment.name}</strong>
                <small>{payment.when}</small>
              </span>
              <strong>{payment.amount}</strong>
            </button>
          ))}
        </div>
      </section>

      <p className="prototype-note">{SIMULATED_NOTE}</p>
    </div>
  );
}
