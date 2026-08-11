import { useDisputeViewModel } from "@/core/viewmodels/useSupportViewModel";
import { PageBar } from "../layout/PageBar";
import { SegmentedControl } from "../primitives/SegmentedControl";
import { StateBlock } from "../primitives/StateBlock";

export function DisputeScreen() {
  const vm = useDisputeViewModel();

  return (
    <div className="onboarding-page dispute-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Dispute options" />

      {!vm.isReady ? (
        <StateBlock
          tone="empty"
          title="No payment selected"
          message="Open the payment you want to dispute from your activity first."
          action={{ label: "Go back", onPress: vm.back }}
        />
      ) : vm.filed ? (
        <StateBlock
          tone="empty"
          title="Dispute filed"
          message={vm.confirmation}
          action={{ label: "View the transaction", onPress: vm.viewTransaction, variant: "primary" }}
        />
      ) : (
        <>
          <section className="activity-intro">
            <h1>What went wrong?</h1>
            <p>Tell us what happened and we will take it up with the receiving bank.</p>
          </section>

          <section className="money-field">
            <span className="field-label">Reason</span>
            <SegmentedControl
              label="Dispute reason"
              options={vm.reasons.map((reason) => ({ id: reason.id, label: reason.label }))}
              selectedId={vm.reasons.find((reason) => reason.selected)?.id ?? null}
              onSelect={vm.selectReason}
            />
          </section>

          <label className="money-note">
            <span className="field-label">Anything else? (optional)</span>
            <textarea
              className="dispute-detail"
              rows={4}
              placeholder="What happened, and when did you notice?"
              aria-label="Dispute details"
              value={vm.detail}
              onChange={(event) => vm.setDetail(event.target.value)}
            />
          </label>

          {vm.error && (
            <p className="transfer-error" role="alert">
              {vm.error}
            </p>
          )}

          <div className="money-actions">
            <button className="primary-button" type="button" disabled={!vm.canSubmit} onClick={() => void vm.submit()}>
              {vm.isSubmitting ? "Filing your dispute…" : "File this dispute"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
