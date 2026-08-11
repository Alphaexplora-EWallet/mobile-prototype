import { useWalletViewModel } from "@/core/viewmodels/useWalletViewModel";
import { Icon } from "../primitives/Icon";
import { ControlRow } from "../primitives/ControlRow";
import { LinkRow } from "../primitives/LinkRow";
import { Toggle } from "../primitives/Toggle";
import { PaymentCard } from "../cards/PaymentCard";

export function WalletScreen() {
  const vm = useWalletViewModel();
  return (
    <div className="tab-page wallet-page">
      <header className="centered-app-bar page-app-bar">
        <span className="app-bar-spacer" />
        <strong>{vm.title}</strong>
        <button className="icon-button clear-button" type="button" aria-label="Card options" onClick={vm.openAccount}>
          <Icon name="more" />
        </button>
      </header>

      {vm.limitSetupActive && (
        <div className="quest-context-banner">
          <Icon name="target" />
          <span>
            <strong>{vm.limitBanner.title}</strong>
            <small>{vm.limitBanner.detail}</small>
          </span>
        </div>
      )}

      <section className="card-stack" aria-label="Your cards">
        {vm.cards.map((card) => (
          <PaymentCard
            key={card.id}
            card={card}
            selected={vm.selectedCardId === card.id}
            onClick={() => vm.selectCard(card.id)}
            onFreeze={() => vm.toggleFrozen(card.id)}
          />
        ))}
      </section>

      {vm.jar.opened && (
        <section className="jar-card" aria-label="Savings jar">
          <span className="jar-card-icon">
            <Icon name="star" />
          </span>
          <span className="jar-card-copy">
            <strong>{vm.jar.heading}</strong>
            <small>{vm.jar.detail}</small>
            <b aria-live="polite">{vm.jar.balanceLabel}</b>
          </span>
          <span className="jar-card-actions">
            <button type="button" onClick={() => vm.startJarMove("in")}>
              Add money
            </button>
            <button type="button" onClick={() => vm.startJarMove("out")}>
              Withdraw
            </button>
          </span>
        </section>
      )}

      <button className="add-card-button" type="button" onClick={vm.addCard}>
        <Icon name="plus" /> Add card
      </button>

      {vm.moveMoney.visible && (
        <section className="money-field wallet-move-money">
          <h2>Move money</h2>
          <div className="control-list">
            {vm.moveMoney.rows.map((row) => (
              <LinkRow
                key={row.id}
                icon={row.icon}
                title={row.title}
                detail={row.detail}
                onClick={() => vm.goTo(row.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className={`controls-section ${vm.limitSetupActive ? "is-highlighted" : ""}`}>
        <h2>{vm.controlsTitle}</h2>
        <div className="control-list">
          {vm.controls.map((control) => (
            <ControlRow
              key={control.id}
              icon={control.icon}
              title={control.title}
              detail={control.detail}
              trailing={
                <Toggle
                  checked={control.checked}
                  onChange={(value) => vm.setControl(control.id, value)}
                  label={control.title}
                />
              }
            />
          ))}
          <ControlRow
            icon="limit"
            title={vm.spendingLimit.title}
            detail={vm.spendingLimit.detail}
            trailing={
              <strong className="limit-amount">
                {vm.spendingLimit.amountLabel} <small>{vm.spendingLimit.periodLabel}</small>
              </strong>
            }
          />
        </div>
      </section>

      {vm.limitSetupActive && (
        <div className="wallet-limit-actions">
          <button className="primary-button" type="button" onClick={vm.confirmLimit}>
            {vm.confirmLimitLabel}
          </button>
          <button className="text-button" type="button" onClick={vm.cancelLimit}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
