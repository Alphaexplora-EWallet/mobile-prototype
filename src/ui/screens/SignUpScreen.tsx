import { BrandMark } from "../layout/BrandMark";
import { Icon } from "../primitives/Icon";
import { useSignUpViewModel } from "@/core/viewmodels/useSignUpViewModel";

export function SignUpScreen() {
  const vm = useSignUpViewModel();

  return (
    <div className="onboarding-page sign-in-page">
      <header className="centered-app-bar sign-in-header">
        <button className="icon-button" type="button" onClick={vm.back} aria-label="Back to welcome">
          <Icon name="arrow-left" />
        </button>
        <BrandMark compact />
        <span className="app-bar-spacer" />
      </header>

      <section className="sign-in-copy">
        <p className="eyebrow">{vm.title}</p>
        <h1>
          What&apos;s your
          <br />
          mobile number?
        </h1>
        <p>{vm.intro}</p>
      </section>

      <label className="auth-form">
        <span className="field-label">Mobile number</span>
        <span className="input-shell">
          <Icon name="phone" />
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="0917 123 4567"
            aria-label="Mobile number"
            value={vm.mobile}
            onChange={(event) => vm.setMobile(event.target.value)}
          />
        </span>
      </label>

      {vm.error && (
        <p className="transfer-error" role="alert">
          {vm.error}
        </p>
      )}

      <div className="money-actions">
        <button className="primary-button" type="button" onClick={vm.continue}>
          Continue
        </button>
        <button className="text-button" type="button" onClick={vm.signIn}>
          Already have an account? Sign in
        </button>
        <p className="prototype-note">By continuing you agree to FIN-A&apos;s Terms of Service and Privacy Notice.</p>
      </div>
    </div>
  );
}
