import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";
import { PageBar } from "../layout/PageBar";
import { StateBlock } from "../primitives/StateBlock";
import { TransactionRow } from "../money/TransactionRow";
import { BillerRow } from "../primitives/BillerRow";
import { usePaymentsViewModel } from "@/core/viewmodels/useMoneyMovementViewModel";

export function PaymentsScreen() {
  const vm = usePaymentsViewModel();
  const { source } = vm;

  return (
    <div className="tab-page money-page payments-page">
      <PageBar title="Pay" optionsLabel="Payment options" />

      <button className="pay-scan-card" type="button" onClick={vm.scanToPay}>
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
        <span className="field-label">Buy load</span>
        <div className="control-list">
          {vm.loadOperators.map((operator) => (
            <LinkRow
              key={operator.id}
              icon={operator.icon}
              title={operator.name}
              detail={operator.detail}
              onClick={() => vm.buyLoad(operator.id)}
            />
          ))}
        </div>
      </section>

      <section className="money-field">
        <span className="field-label">Pay a bill</span>

        <label className="money-note biller-search">
          <span className="input-shell">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Search billers"
              aria-label="Search billers"
              value={vm.searchQuery}
              onChange={(event) => vm.setSearchQuery(event.target.value)}
            />
          </span>
        </label>

        {vm.emptySearch && <StateBlock tone="empty" message="No billers match that search." />}

        {vm.showFavorites && (
          <div className="biller-group">
            <span className="field-label">Favorites</span>
            <div className="control-list">
              {vm.favorites.map((biller) => (
                <BillerRow
                  key={biller.id}
                  biller={biller}
                  favorited={biller.favorited}
                  onPress={() => vm.payBill(biller.id)}
                  onToggleFavorite={() => vm.toggleFavorite(biller.id)}
                />
              ))}
            </div>
          </div>
        )}

        {vm.catalog.map((group) => (
          <div className="biller-group" key={group.category}>
            <span className="field-label">{group.label}</span>
            <div className="control-list">
              {group.billers.map((biller) => (
                <BillerRow
                  key={biller.id}
                  biller={biller}
                  favorited={biller.favorited}
                  onPress={() => vm.payBill(biller.id)}
                  onToggleFavorite={() => vm.toggleFavorite(biller.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="home-section">
        <h2>Scheduled</h2>
        <div className="transaction-list">
          {vm.scheduledLabels.map((payment) => (
            <TransactionRow key={payment.id} row={payment} onPress={() => vm.openAutopay(payment.id)} />
          ))}
        </div>
      </section>

      <p className="prototype-note">{vm.simulatedNote}</p>
    </div>
  );
}
