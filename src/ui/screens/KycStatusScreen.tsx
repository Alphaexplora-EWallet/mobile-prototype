import { useKycStatusViewModel } from "@/core/viewmodels/useComplianceViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";
import { StateBlock } from "../primitives/StateBlock";

export function KycStatusScreen() {
  const vm = useKycStatusViewModel();

  return (
    <div className="onboarding-page kyc-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Verification options" />

      {vm.isLoading && <StateBlock tone="loading" message="Checking your verification…" />}
      {vm.error && <StateBlock tone="error" message={vm.error} />}

      {!vm.isLoading && !vm.error && (
        <>
          <section className="tier-hero">
            <span className="tier-badge">
              <Icon name="check" />
            </span>
            <h1>{vm.tierName}</h1>
            <small>{vm.stateLabel}</small>
            <p>{vm.tierRequirement}</p>
          </section>

          <section className="tier-card" aria-label="What you can do now">
            <h2>What you can do now</h2>
            <ul>
              {vm.unlocked.map((item) => (
                <li key={item}>
                  <Icon name="check" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {vm.isRejected ? (
            <section className="tier-card tier-rejected" role="alert" aria-label="Submission rejected">
              <h2>Your submission was rejected</h2>
              <p className="rejection-reason">{vm.rejectedReason}</p>
              <p className="rejection-hint">
                Review stopped at the {vm.rejectedStepLabel} — re-capture it and resubmit.
              </p>
              <button className="primary-button" type="button" onClick={vm.resubmit}>
                Resubmit
              </button>
            </section>
          ) : vm.nextTier ? (
            <section className="tier-card tier-next" aria-label="Next tier">
              <h2>Unlock {vm.nextTier.name}</h2>
              <p>{vm.nextTier.requirement}</p>
              <ul>
                {vm.nextTier.unlocks.map((item) => (
                  <li key={item}>
                    <Icon name="plus" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button className="primary-button" type="button" onClick={vm.startVerification}>
                Start verification
              </button>
            </section>
          ) : (
            <StateBlock tone="empty" message="You are fully verified. Everything this wallet offers is unlocked." />
          )}
        </>
      )}
    </div>
  );
}
