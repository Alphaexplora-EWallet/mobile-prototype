import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";
import { PageBar } from "../layout/PageBar";
import { SourcePicker } from "../cards/SourcePicker";
import { AmountField } from "../money/AmountField";
import { useDepositViewModel } from "@/core/viewmodels/useMoneyMovementViewModel";

export function DepositScreen() {
  const vm = useDepositViewModel();
  const { cards, amount } = vm;
  const destination = vm.source;

  return (
    <div className="onboarding-page money-page deposit-page">
      <PageBar title="Add money" onBack={vm.back} optionsLabel="Deposit options" />

      <SourcePicker label="To" cards={[...cards]} selected={destination.id} onSelect={vm.selectCard} />
      <AmountField
        label="Amount to add"
        value={amount}
        onChange={vm.setAmount}
        available={destination.balanceLabel}
        presets={vm.presets}
        selectedPresetId={vm.selectedPresetId}
        onSelectPreset={vm.selectPreset}
      />

      <section className="money-field">
        <span className="field-label">Choose a method</span>
        <div className="control-list">
          {vm.methods.map((item) => (
            <LinkRow
              key={item.id}
              icon={item.icon}
              title={item.title}
              detail={item.detail}
              selected={vm.selectedMethod === item.id}
              onClick={() => vm.selectMethod(item.id)}
            />
          ))}
        </div>
      </section>

      {/*
       * Both lines come from the selected method now. They read exactly as the
       * hardcoded pair did for the default (linked bank), and tell the truth for
       * the others — over the counter really does charge ₱20.
       */}
      <div className="summary-strip">
        <Icon name="arrow-down" />
        <span>
          <strong>{vm.feeLabel}</strong>
          <small>{vm.arrivalLabel}</small>
        </span>
      </div>

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canContinue} onClick={vm.submit}>
          Add money
        </button>
        <p className="prototype-note">{vm.simulatedNote}</p>
      </div>
    </div>
  );
}
