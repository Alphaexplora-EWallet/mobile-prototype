import { useSendMobileViewModel } from "@/core/viewmodels/useSendMobileViewModel";
import { PageBar } from "../layout/PageBar";
import { AmountField } from "../money/AmountField";
import { Icon } from "../primitives/Icon";

export function SendMobileScreen() {
  const vm = useSendMobileViewModel();

  return (
    <div className="onboarding-page money-page destination-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Mobile send options" />

      <section className="activity-intro">
        <h1>Send to a mobile number</h1>
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

      <label className="money-note">
        <span className="field-label">Mobile number</span>
        <span className="input-shell">
          <Icon name="send" />
          <input
            type="text"
            inputMode="numeric"
            placeholder="0917 123 4567"
            aria-label="Mobile number"
            value={vm.mobileNumber}
            onChange={(event) => vm.setMobileNumber(event.target.value)}
          />
        </span>
      </label>

      <button
        className="secondary-button verify-button"
        type="button"
        disabled={!vm.canVerify}
        onClick={() => void vm.verify()}
      >
        {vm.isVerifying ? "Checking the number…" : "Check name"}
      </button>

      {vm.confirmationPrompt && (
        <p className="verified-name" role="status">
          <Icon name="check" />
          <span>{vm.confirmationPrompt}</span>
        </p>
      )}

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
