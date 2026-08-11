import { usePaymentReviewViewModel } from "@/core/viewmodels/usePaymentFlowViewModel";
import { PageBar } from "../layout/PageBar";
import { DetailCard } from "../primitives/DetailCard";
import { Icon } from "../primitives/Icon";
import { StateBlock } from "../primitives/StateBlock";

export function PaymentReviewScreen() {
  const vm = usePaymentReviewViewModel();

  return (
    <div className="onboarding-page payment-review-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Payment options" />

      {!vm.isReady ? (
        <StateBlock
          tone="empty"
          title="Almost there"
          message="Choose a destination and enter an amount before you can review this payment."
          action={{ label: "Go back", onPress: vm.back }}
          className="transfer-incomplete"
        />
      ) : (
        <>
          <section className="review-hero">
            <span className="review-icon">
              <Icon name="send" />
            </span>
            <p>{vm.lead}</p>
            <h1>{vm.amountLabel}</h1>
            <strong>to {vm.counterparty}</strong>
            <small>{vm.counterpartyDetail}</small>
          </section>

          <DetailCard label="Payment summary" className="review-card" rows={vm.rows} />

          {vm.cutoffLabel && (
            <p className="rail-note">
              <Icon name="clock" />
              <span>{vm.cutoffLabel}</span>
            </p>
          )}
          {vm.limitLabel && <p className="rail-note-quiet">{vm.limitLabel}</p>}

          {vm.error && (
            <p className="transfer-error" role="alert">
              {vm.error}
            </p>
          )}

          <div className="money-actions">
            <button className="primary-button" type="button" disabled={!vm.canSubmit} onClick={() => void vm.confirm()}>
              {vm.isSubmitting ? vm.submittingLabel : vm.isQuoting ? "Checking the rail…" : vm.actionLabel}
            </button>
            <p className="prototype-note">
              This NetBank sandbox flow creates a local receipt; no real funds are moved.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
