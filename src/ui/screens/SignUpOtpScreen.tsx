import { useSignUpOtpViewModel } from "@/core/viewmodels/useSignUpViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";

export function SignUpOtpScreen() {
  const vm = useSignUpOtpViewModel();

  return (
    <div className="onboarding-page otp-page">
      <PageBar title="Sign up" onBack={vm.back} optionsLabel="Sign-up options" />

      <section className="confirm-hero">
        <span className="confirm-lock">
          <Icon name="phone" />
        </span>
        <h1>{vm.title}</h1>
        <p>{vm.intro}</p>
        <small>{vm.expiresLabel}</small>
      </section>

      <label className="pin-field">
        <span className="field-label">One-time code</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={"•".repeat(vm.digits)}
          aria-label="One-time code"
          value={vm.code}
          onChange={(event) => vm.setCode(event.target.value)}
        />
      </label>

      {vm.error && (
        <p className="transfer-error" role="alert">
          {vm.error}
        </p>
      )}

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canSubmit} onClick={() => void vm.submit()}>
          {vm.isVerifying ? "Checking your code…" : "Verify and continue"}
        </button>
        <button className="text-button" type="button" onClick={() => void vm.resend()}>
          Send a new code
        </button>
        <p className="prototype-note">{vm.hint}</p>
      </div>
    </div>
  );
}
