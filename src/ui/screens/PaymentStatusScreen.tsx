import { usePaymentStatusViewModel } from "@/core/viewmodels/usePaymentFlowViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";
import { StateBlock } from "../primitives/StateBlock";

export function PaymentStatusScreen() {
  const vm = usePaymentStatusViewModel();

  return (
    <div className="onboarding-page payment-status-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Status options" />

      {!vm.isReady ? (
        <StateBlock
          tone="empty"
          title="Nothing to track"
          message="Send a transfer over PESONet to follow it while it settles."
          action={{ label: "Go back", onPress: vm.back }}
        />
      ) : (
        <>
          <section className="status-summary">
            <span className="status-chip">{vm.statusLabel}</span>
            <h1>{vm.amountLabel}</h1>
            <strong>{vm.counterparty}</strong>
            <small>
              {vm.railLabel} · {vm.reference}
            </small>
            <p>{vm.detail}</p>
          </section>

          <ol className="status-timeline" aria-label="Settlement timeline">
            {vm.steps.map((step) => (
              <li className={step.done ? "is-done" : ""} key={step.id}>
                <span className="status-dot" aria-hidden="true">
                  {step.done && <Icon name="check" />}
                </span>
                <span>{step.label}</span>
              </li>
            ))}
          </ol>

          {vm.error && (
            <p className="transfer-error" role="alert">
              {vm.error}
            </p>
          )}

          <div className="receipt-actions">
            {vm.settling && (
              <button className="primary-button" type="button" disabled={vm.isChecking} onClick={() => void vm.check()}>
                {vm.isChecking ? "Checking with the rail…" : "Check for an update"}
              </button>
            )}
            <button className="secondary-button" type="button" onClick={vm.viewActivity}>
              View transaction
            </button>
          </div>
        </>
      )}
    </div>
  );
}
