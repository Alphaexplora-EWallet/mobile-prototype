import { useSignUpPinViewModel } from "@/core/viewmodels/useAuthViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";
import { PinField } from "../primitives/PinField";

export function SignUpPinScreen() {
  const vm = useSignUpPinViewModel();

  return (
    <div className="onboarding-page auth-page">
      <PageBar title={vm.pageTitle} onBack={vm.back} optionsLabel="MPIN options" />

      <section className="confirm-hero">
        <span className="confirm-lock">
          <Icon name="lock" />
        </span>
        <h1>{vm.title}</h1>
        <p>{vm.intro}</p>
        <small>{vm.rulesHint}</small>
      </section>

      <PinField
        label="New MPIN"
        value={vm.pin}
        onChange={vm.setPin}
        digits={vm.digits}
        secret
        autoComplete="new-password"
      />
      <PinField
        label="Confirm MPIN"
        value={vm.confirm}
        onChange={vm.setConfirm}
        digits={vm.digits}
        secret
        autoComplete="new-password"
      />

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
