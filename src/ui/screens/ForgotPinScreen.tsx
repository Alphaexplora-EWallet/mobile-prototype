import { useForgotPinViewModel } from "@/core/viewmodels/useAuthViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";

export function ForgotPinScreen() {
  const vm = useForgotPinViewModel();

  return (
    <div className="onboarding-page forgot-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Reset options" />

      <section className="activity-intro">
        <h1>Forgot your MPIN?</h1>
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

      {vm.error && (
        <p className="transfer-error" role="alert">
          {vm.error}
        </p>
      )}

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canSubmit} onClick={() => void vm.submit()}>
          {vm.submitLabel}
        </button>
      </div>
    </div>
  );
}
