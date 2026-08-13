import { useEffect, useRef } from "react";
import { Icon } from "../primitives/Icon";
import { PageBar } from "../layout/PageBar";
import { StateBlock } from "../primitives/StateBlock";
import { SourcePicker } from "../cards/SourcePicker";
import { AmountField } from "../money/AmountField";
import { useTransferViewModel } from "@/core/viewmodels/useMoneyMovementViewModel";

const STEP_TITLE: Readonly<Record<1 | 2, string>> = { 1: "Send to", 2: "Amount" };

export function TransferScreen() {
  const vm = useTransferViewModel();
  const { cards, source, amount, note } = vm;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [vm.step]);

  return (
    <div className="onboarding-page money-page transfer-page">
      <h1 className="sr-only" tabIndex={-1} ref={headingRef}>
        {STEP_TITLE[vm.step]}
      </h1>
      <PageBar title="Send money" onBack={vm.back} optionsLabel="Transfer options" />

      <div className="capture-progress">
        <span className="field-label">Step {vm.step} of 2</span>
        <div
          className="progress-track"
          role="progressbar"
          aria-label={`Step ${vm.step} of 2`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={vm.step === 1 ? 50 : 100}
        >
          <span style={{ width: `${vm.step === 1 ? 50 : 100}%` }} />
        </div>
      </div>

      {vm.step === 1 && (
        <section className="money-field">
          <span className="field-label">Send to</span>

          {vm.recipients.length === 0 ? (
            <>
              <StateBlock tone="empty" message="You have not saved any recipients yet." />
              <button className="primary-button" type="button" onClick={vm.manageRecipients}>
                Add a recipient
              </button>
            </>
          ) : (
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
          )}
        </section>
      )}

      {vm.step === 2 && (
        <>
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

          {vm.amountError && (
            <p className="transfer-error" role="alert">
              {vm.amountError}
            </p>
          )}

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

          {vm.feePreview && (
            <div className="summary-strip">
              <Icon name="bolt" />
              <span>
                <strong>{vm.feePreview.feeLabel}</strong>
                <small>{vm.feePreview.arrivalLabel}</small>
              </span>
            </div>
          )}
        </>
      )}

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canAdvance} onClick={vm.advance}>
          {vm.step === 1 ? "Continue" : "Continue and review"}
        </button>
        {vm.step === 2 && <p className="prototype-note">{vm.simulatedNote}</p>}
      </div>
    </div>
  );
}
