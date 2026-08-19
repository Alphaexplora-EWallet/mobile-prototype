import { useSignInViewModel } from "@/core/viewmodels/useAuthViewModel";
import { BrandMark } from "../layout/BrandMark";
import { Icon } from "../primitives/Icon";
import { PinField } from "../primitives/PinField";

export function SignInScreen() {
  const vm = useSignInViewModel();

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
          Pick up where
          <br />
          you left off
        </h1>
        <p>{vm.intro}</p>
      </section>

      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          vm.submit();
        }}
      >
        <label>
          <span>Mobile number</span>
          <span className="input-shell">
            <Icon name="phone" />
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="09XX XXX XXXX"
              value={vm.mobile}
              onChange={(event) => vm.setMobile(event.target.value)}
              required
            />
          </span>
        </label>

        <PinField
          label="MPIN"
          value={vm.pin}
          onChange={vm.setPin}
          digits={vm.digits}
          secret
          autoComplete="current-password"
        />

        <button className="forgot-button" type="button" onClick={vm.forgotPin}>
          Forgot MPIN?
        </button>

        {vm.error && (
          <p className="transfer-error" role="alert">
            {vm.error}
          </p>
        )}

        <button className="primary-button" type="submit" disabled={!vm.canSubmit}>
          {vm.submitLabel}
        </button>

        {vm.biometricsEnabled && (
          <button className="secondary-button biometric-button" type="button" onClick={vm.useBiometrics}>
            <Icon name="shield" />
            {vm.biometricLabel}
          </button>
        )}
      </form>

      <div className="demo-auth">
        <span>Frontend prototype</span>
        <p>{vm.demoHint}</p>
        <button className="secondary-button" type="button" onClick={vm.useDemoAccount}>
          {vm.demoLabel}
        </button>
        <button className="text-button" type="button" onClick={vm.createAccount}>
          Create a new wallet
        </button>
      </div>
    </div>
  );
}
