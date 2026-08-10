import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";
import { PageBar } from "../layout/PageBar";
import { usePaymentsViewModel } from "@/core/viewmodels/useMoneyMovementViewModel";

export function PaymentsScreen() {
  const vm = usePaymentsViewModel();
  const { source } = vm;

  return (
    <div className="tab-page money-page payments-page">
      <PageBar title="Pay" optionsLabel="Payment options" />

      <button className="pay-scan-card" type="button" onClick={() => vm.simulate("Pay with QR")}>
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
            onClick={() => vm.goTo("transfer")}
          />
          <LinkRow
            icon="arrow-down"
            title="Add money"
            detail="Cash in from bank, card, or counter"
            onClick={() => vm.goTo("deposit")}
          />
        </div>
      </section>

      <section className="money-field">
        <span className="field-label">Pay a bill</span>
        <div className="control-list">
          {vm.billers.map((biller) => (
            <LinkRow
              key={biller.id}
              icon={biller.icon}
              title={biller.name}
              detail={biller.detail}
              meta={biller.due}
              onClick={() => vm.simulate(`Pay ${biller.name}`)}
            />
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2>Scheduled</h2>
        <div className="transaction-list">
          {vm.scheduledLabels.map((payment) => (
            <button
              type="button"
              className="transaction-row"
              key={payment.id}
              onClick={() => vm.simulate(payment.name)}
            >
              <span className="transaction-icon">{payment.glyph}</span>
              <span className="transaction-copy">
                <strong>{payment.name}</strong>
                <small>{payment.when}</small>
              </span>
              <strong>{payment.amountLabel}</strong>
            </button>
          ))}
        </div>
      </section>

      <p className="prototype-note">{vm.simulatedNote}</p>
    </div>
  );
}
