import { Icon } from "../primitives/Icon";
import { PageBar } from "../layout/PageBar";
import { AmountField } from "../money/AmountField";
import { useRequestMoneyViewModel } from "@/core/viewmodels/useRequestMoneyViewModel";

/**
 * Request money (GAP-03): pick a saved recipient, an amount and an optional
 * note, then file a *pending* request. The request itself moves nothing — it
 * shows as pending in Activity until the recipient accepts and the payment
 * runs through the shared pipeline.
 */
export function RequestEntryScreen() {
  const vm = useRequestMoneyViewModel();

  return (
    <div className="onboarding-page money-page request-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Request options" />

      <section className="money-field">
        <span className="field-label">Request from</span>
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

      <AmountField
        label="Amount to request"
        value={vm.amount}
        onChange={vm.setAmount}
        available="No fee for requests"
        presets={vm.presets}
        selectedPresetId={vm.selectedPresetId}
        onSelectPreset={vm.selectPreset}
      />

      {vm.error && (
        <p className="transfer-error" role="alert">
          {vm.error}
        </p>
      )}

      <label className="money-note">
        <span className="field-label">Note (optional)</span>
        <span className="input-shell">
          <Icon name="mail" />
          <input
            type="text"
            placeholder="What is this for?"
            value={vm.note}
            onChange={(event) => vm.setNote(event.target.value)}
          />
        </span>
      </label>

      <div className="summary-strip">
        <Icon name="arrow-down" />
        <span>
          <strong>No fee</strong>
          <small>Money moves only when they accept</small>
        </span>
      </div>

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canSend} onClick={vm.send}>
          Send request
        </button>
        <p className="prototype-note">
          {vm.simulatedNote ?? "This request stays pending until the recipient responds."}
        </p>
      </div>
    </div>
  );
}
