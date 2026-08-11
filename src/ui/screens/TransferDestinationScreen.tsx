import { useTransferDestinationViewModel } from "@/core/viewmodels/useTransferDestinationViewModel";
import { PageBar } from "../layout/PageBar";
import { AmountField } from "../money/AmountField";
import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";
import { SegmentedControl } from "../primitives/SegmentedControl";
import { StateBlock } from "../primitives/StateBlock";
import { Toggle } from "../primitives/Toggle";

export function TransferDestinationScreen() {
  const vm = useTransferDestinationViewModel();

  return (
    <div className="onboarding-page money-page destination-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Destination options" />

      <section className="activity-intro">
        <h1>Send to a bank</h1>
        <p>{vm.intro}</p>
      </section>

      <AmountField
        label="Amount to send"
        value={vm.amount}
        onChange={vm.setAmount}
        available={vm.availableLabel}
        presets={[]}
        selectedPresetId={null}
        onSelectPreset={vm.setAmount}
      />

      <section className="money-field">
        <span className="field-label">Bank</span>
        {vm.isLoadingBanks ? (
          <StateBlock tone="loading" message="Loading the bank directory…" />
        ) : (
          <div className="control-list">
            {vm.banks.map((bank) => (
              <LinkRow
                key={bank.id}
                icon="bank"
                title={bank.title}
                detail={bank.detail}
                selected={bank.selected}
                onClick={() => vm.selectBank(bank.id)}
              />
            ))}
          </div>
        )}
      </section>

      <label className="money-note">
        <span className="field-label">Account number</span>
        <span className="input-shell">
          <Icon name="card" />
          <input
            type="text"
            inputMode="numeric"
            placeholder="10 to 16 digits"
            aria-label="Account number"
            value={vm.accountNumber}
            onChange={(event) => vm.setAccountNumber(event.target.value)}
          />
        </span>
      </label>

      <button
        className="secondary-button verify-button"
        type="button"
        disabled={!vm.canVerify}
        onClick={() => void vm.verify()}
      >
        {vm.isVerifying ? "Checking with the bank…" : "Check account name"}
      </button>

      {vm.confirmationPrompt && (
        <p className="verified-name" role="status">
          <Icon name="check" />
          <span>{vm.confirmationPrompt}</span>
        </p>
      )}

      {vm.railOptions.length > 0 && (
        <section className="money-field">
          <span className="field-label">Rail</span>
          <SegmentedControl
            label="Transfer rail"
            options={vm.railOptions}
            selectedId={vm.selectedRail}
            onSelect={vm.selectRail}
          />
        </section>
      )}

      <div className="control-row">
        <span className="control-icon">
          <Icon name="star" />
        </span>
        <span className="control-copy">
          <strong>Save this recipient</strong>
          <small>Keep it for next time</small>
        </span>
        <Toggle checked={vm.saveRecipient} onChange={vm.toggleSaveRecipient} label="Save this recipient" />
      </div>

      <label className="money-note">
        <span className="field-label">Note (optional)</span>
        <span className="input-shell">
          <Icon name="mail" />
          <input
            type="text"
            placeholder="What is this for?"
            value={vm.noteValue}
            onChange={(event) => vm.setNote(event.target.value)}
          />
        </span>
      </label>

      {vm.error && (
        <p className="transfer-error" role="alert">
          {vm.error}
        </p>
      )}

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canContinue} onClick={vm.review}>
          Continue
        </button>
      </div>
    </div>
  );
}
