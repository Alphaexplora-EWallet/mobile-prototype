import { useSignUpPinViewModel } from "@/core/viewmodels/useSignUpViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";

export function SignUpPinScreen() {
  const vm = useSignUpPinViewModel();

  return (
    <div className="onboarding-page otp-page">
      <PageBar title="Sign up" onBack={vm.back} optionsLabel="Sign-up options" />

      <section className="confirm-hero">
        <span className="confirm-lock">
          <Icon name="lock" />
        </span>
        <h1>{vm.title}</h1>
        <p>{vm.intro}</p>
      </section>

      <div className="auth-form">
        <label className="signup-pin">
          <span>Transaction PIN</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            placeholder="••••••"
            aria-label="Transaction PIN"
            value={vm.pin}
            onChange={(event) => vm.setPin(event.target.value)}
          />
        </label>
        <label className="signup-pin">
          <span>Re-enter your PIN</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            placeholder="••••••"
            aria-label="Re-enter your PIN"
            value={vm.confirm}
            onChange={(event) => vm.setConfirm(event.target.value)}
          />
        </label>
      </div>

      {(vm.fieldError ?? vm.error) && (
        <p className="transfer-error" role="alert">
          {vm.fieldError ?? vm.error}
        </p>
      )}

      <div className="money-actions">
        <button className="primary-button" type="button" onClick={() => void vm.submit()}>
          {vm.isSaving ? "Creating your account…" : "Create my account"}
        </button>
        <p className="prototype-note">Your PIN is stored only on this device — FIN-A never sees it.</p>
      </div>
    </div>
  );
}
