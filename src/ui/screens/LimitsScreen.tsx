import { useLimitsViewModel } from "@/core/viewmodels/useComplianceViewModel";
import { PageBar } from "../layout/PageBar";
import { StateBlock } from "../primitives/StateBlock";

export function LimitsScreen() {
  const vm = useLimitsViewModel();

  return (
    <div className="onboarding-page limits-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Limit options" />

      {vm.isLoading && <StateBlock tone="loading" message="Loading your limits…" />}
      {vm.error && <StateBlock tone="error" message={vm.error} />}

      {!vm.isLoading && !vm.error && (
        <>
          <section className="activity-intro">
            <p className="eyebrow">{vm.tierName} account</p>
            <h1>Limits and fees</h1>
            <p>Each rail prices and caps differently. Verification raises what you can move.</p>
          </section>

          {vm.rails.map((rail) => (
            <section
              className={rail.available ? "rail-card" : "rail-card is-locked"}
              aria-label={rail.name}
              key={rail.id}
            >
              <div className="rail-card-head">
                <strong>{rail.name}</strong>
                <span className="rail-fee">{rail.feeLabel}</span>
              </div>

              {rail.available ? (
                <>
                  <div className="progress-track" aria-label={`${rail.remainingLabel} left today`}>
                    <span style={{ width: `${rail.usedPercent}%` }} />
                  </div>
                  <small className="rail-remaining">{rail.remainingLabel} left today</small>
                </>
              ) : (
                <small className="rail-locked-note">Locked until you are fully verified.</small>
              )}

              <dl className="rail-figures">
                <div>
                  <dt>Per transfer</dt>
                  <dd>{rail.perTransactionLabel}</dd>
                </div>
                <div>
                  <dt>Daily</dt>
                  <dd>{rail.dailyLabel}</dd>
                </div>
                <div>
                  <dt>Monthly</dt>
                  <dd>{rail.monthlyLabel}</dd>
                </div>
              </dl>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
