import { useCashOutViewModel } from "@/core/viewmodels/useCashOutViewModel";
import { SourcePicker } from "../cards/SourcePicker";
import { PageBar } from "../layout/PageBar";
import { AmountField } from "../money/AmountField";
import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";

export function CashOutScreen() {
  const vm = useCashOutViewModel();

  return (
    <div className="onboarding-page money-page cashout-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Cash-out options" />

      <section className="activity-intro">
        <h1>Cash out</h1>
        <p>{vm.intro}</p>
      </section>

      <SourcePicker label="From" cards={[...vm.cards]} selected={vm.source.id} onSelect={vm.selectCard} />
      <AmountField
        label="Amount to withdraw"
        value={vm.amount}
        onChange={vm.setAmount}
        available={vm.availableLabel}
        presets={vm.presets}
        selectedPresetId={vm.selectedPresetId}
        onSelectPreset={vm.selectPreset}
      />

      <section className="money-field">
        <span className="field-label">Withdraw to</span>
        <div className="control-list">
          {vm.accounts.map((account) => (
            <LinkRow
              key={account.id}
              icon={account.icon}
              title={account.title}
              detail={account.detail}
              selected={account.selected}
              onClick={() => vm.selectAccount(account.id)}
            />
          ))}
        </div>
      </section>

      <div className="summary-strip">
        <Icon name="bank" />
        <span>
          <strong>{vm.feeLabel}</strong>
          <small>{vm.arrivalLabel}</small>
        </span>
      </div>
      {vm.limitLabel && <p className="rail-note-quiet">{vm.limitLabel}</p>}

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canContinue} onClick={vm.review}>
          Continue
        </button>
        <p className="prototype-note">{vm.simulatedNote}</p>
      </div>
    </div>
  );
}
