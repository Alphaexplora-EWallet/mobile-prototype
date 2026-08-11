import { Icon } from "../primitives/Icon";
import { PageBar } from "../layout/PageBar";
import { SourcePicker } from "../cards/SourcePicker";
import { AmountField } from "../money/AmountField";
import { useTransferViewModel } from "@/core/viewmodels/useMoneyMovementViewModel";

export function TransferScreen() {
  const vm = useTransferViewModel();
  const { cards, source, amount, note } = vm;

  return (
    <div className="onboarding-page money-page transfer-page">
      <PageBar title="Send money" onBack={vm.back} optionsLabel="Transfer options" />

      <SourcePicker label="From" cards={[...cards]} selected={source.id} onSelect={vm.selectCard} />
      <AmountField
        label="Amount to send"
        value={amount}
        onChange={vm.setAmount}
        available={source.balanceLabel}
        presets={vm.presets}
        selectedPresetId={vm.selectedPresetId}
        onSelectPreset={vm.selectPreset}
      />

      <section className="money-field">
        <span className="field-label">Send to</span>
        <div className="recipient-row">
          {vm.recipients.map((person) => (
            <button
              className={`recipient-chip ${vm.selectedRecipient === person.id ? "is-selected" : ""}`}
              type="button"
              key={person.id}
              onClick={() => vm.selectRecipient(person.id)}
              aria-pressed={vm.selectedRecipient === person.id}
            >
              <span aria-hidden="true">{person.initials}</span>
              <strong>{person.name}</strong>
              <small>{person.handle}</small>
            </button>
          ))}
          <button
            className="recipient-chip recipient-add"
            type="button"
            aria-label="Add recipient"
            onClick={vm.manageRecipients}
          >
            <span aria-hidden="true">
              <Icon name="plus" />
            </span>
            <strong>New</strong>
            <small>Add recipient</small>
          </button>
        </div>
      </section>

      <label className="money-note">
        <span className="field-label">Note (optional)</span>
        <span className="input-shell">
          <Icon name="mail" />
          <input
            type="text"
            placeholder="What is this for?"
            value={note}
            onChange={(event) => vm.setNote(event.target.value)}
          />
        </span>
      </label>

      <div className="summary-strip">
        <Icon name="bolt" />
        <span>
          <strong>Fee ₱0.00</strong>
          <small>Arrives instantly to FIN-A wallets</small>
        </span>
      </div>

      <div className="money-actions">
        <button className="primary-button" type="button" onClick={vm.review}>
          Continue
        </button>
        <p className="prototype-note">{vm.simulatedNote}</p>
      </div>
    </div>
  );
}
