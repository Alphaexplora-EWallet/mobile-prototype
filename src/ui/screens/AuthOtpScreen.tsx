import { useAuthOtpViewModel } from "@/core/viewmodels/useAuthViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";
import { PinField } from "../primitives/PinField";

export function AuthOtpScreen() {
  const vm = useAuthOtpViewModel();

  return (
    <div className="onboarding-page otp-page">
      <PageBar title={vm.pageTitle} onBack={vm.back} optionsLabel="Code options" />

      <section className="confirm-hero">
        <span className="confirm-lock">
          <Icon name="mail" />
        </span>
        <h1>{vm.title}</h1>
        <p>{vm.intro}</p>
        <small>{vm.expiresLabel}</small>
      </section>

      <PinField label="One-time code" value={vm.code} onChange={vm.setCode} digits={vm.digits} />

      {vm.error && (
        <p className="transfer-error" role="alert">
          {vm.error}
        </p>
      )}

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canSubmit} onClick={() => void vm.submit()}>
          {vm.submitLabel}
        </button>
        <button className="text-button" type="button" onClick={() => void vm.resend()}>
          Send a new code
        </button>
        <p className="prototype-note">{vm.hint}</p>
      </div>
    </div>
  );
}
