import { usePaymentConfirmViewModel } from "@/core/viewmodels/usePaymentFlowViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";
import { PinField } from "../primitives/PinField";
import { StateBlock } from "../primitives/StateBlock";

export function PaymentConfirmScreen() {
  const vm = usePaymentConfirmViewModel();

  return (
    <div className="onboarding-page payment-confirm-page">
      <PageBar title="Confirm" onBack={vm.back} optionsLabel="Confirmation options" />

      {!vm.isReady ? (
        <StateBlock
          tone="empty"
          title="Nothing to confirm"
          message={vm.intro}
          action={{ label: "Go back", onPress: vm.back }}
        />
      ) : (
        <>
          <section className="confirm-hero">
            <span className="confirm-lock">
              <Icon name="lock" />
            </span>
            <h1>{vm.title}</h1>
            <p>{vm.intro}</p>
          </section>

          <PinField label="Transaction PIN" value={vm.pin} onChange={vm.setPin} digits={vm.pinLength} secret />

          {vm.error && (
            <p className="transfer-error" role="alert">
              {vm.error}
            </p>
          )}

          <div className="money-actions">
            <button className="primary-button" type="button" disabled={!vm.canSubmit} onClick={() => void vm.confirm()}>
              {vm.isBusy ? vm.busyLabel : "Confirm payment"}
            </button>
            <p className="prototype-note">Sandbox PIN: 246810</p>
          </div>
        </>
      )}
    </div>
  );
}
