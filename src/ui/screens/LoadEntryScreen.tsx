import { useLoadEntryViewModel } from "@/core/viewmodels/useLoadEntryViewModel";
import { PageBar } from "../layout/PageBar";
import { AmountField } from "../money/AmountField";
import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";

export function LoadEntryScreen() {
  const vm = useLoadEntryViewModel();

  return (
    <div className="onboarding-page money-page bill-entry-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Load options" />

      {!vm.isReady ? (
        <section className="money-field">
          <span className="field-label">Choose a mobile network</span>
          <div className="control-list">
            {vm.operators.map((operator) => (
              <LinkRow
                key={operator.id}
                icon={operator.icon}
                title={operator.name}
                detail={operator.detail}
                onClick={() => vm.selectOperator(operator.id)}
              />
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="biller-hero">
            <span className="biller-icon">
              <Icon name={vm.operatorIcon} />
            </span>
            <h1>{vm.operatorName}</h1>
            <small>{vm.operatorDetail}</small>
          </section>

          <label className="money-note">
            <span className="field-label">Mobile number</span>
            <span className="input-shell">
              <Icon name="phone" />
              <input
                type="tel"
                inputMode="numeric"
                placeholder="0917 123 4567"
                aria-label="Mobile number to load"
                aria-invalid={vm.error ? true : undefined}
                value={vm.phoneNumber}
                onChange={(event) => vm.setPhoneNumber(event.target.value)}
              />
            </span>
          </label>

          {vm.error && (
            <p className="transfer-error" role="alert">
              {vm.error}
            </p>
          )}

          <AmountField
            label="Load amount"
            value={vm.amount}
            onChange={vm.setAmount}
            available={vm.availableLabel}
            presets={vm.presets}
            selectedPresetId={vm.selectedPresetId}
            onSelectPreset={vm.selectPreset}
          />

          <div className="money-actions">
            <button className="primary-button" type="button" disabled={!vm.canContinue} onClick={vm.review}>
              Continue
            </button>
          </div>
        </>
      )}
    </div>
  );
}
