import { useSignUpViewModel } from "@/core/viewmodels/useAuthViewModel";
import { PageBar } from "../layout/PageBar";
import { ControlRow } from "../primitives/ControlRow";
import { Icon } from "../primitives/Icon";
import { Toggle } from "../primitives/Toggle";

export function SignUpScreen() {
  const vm = useSignUpViewModel();

  return (
    <div className="onboarding-page auth-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Sign-up options" />

      <section className="activity-intro">
        <h1>What is your mobile number?</h1>
        <p>{vm.intro}</p>
      </section>

      <label className="money-note">
        <span className="field-label">Mobile number</span>
        <span className="input-shell">
          <Icon name="phone" />
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="09XX XXX XXXX"
            aria-label="Mobile number"
            value={vm.mobile}
            onChange={(event) => vm.setMobile(event.target.value)}
          />
        </span>
      </label>

      {vm.formatHint && <p className="prototype-note">{vm.formatHint}</p>}

      <div className="control-list">
        <ControlRow
          icon="shield"
          title={vm.consentLabel}
          detail={vm.consentDetail}
          trailing={<Toggle checked={vm.accepted} onChange={vm.toggleAccepted} label={vm.consentLabel} />}
        />
      </div>

      {vm.error && (
        <p className="transfer-error" role="alert">
          {vm.error}
        </p>
      )}

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canSubmit} onClick={() => void vm.submit()}>
          {vm.isChecking ? "Checking…" : "Send me a code"}
        </button>
        <button className="text-button" type="button" onClick={vm.signIn}>
          I already have a wallet
        </button>
      </div>
    </div>
  );
}
