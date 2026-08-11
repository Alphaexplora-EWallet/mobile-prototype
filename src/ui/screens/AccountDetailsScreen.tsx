import type { IconName } from "@/core/domain/icons";
import { useAccountDetailsViewModel } from "@/core/viewmodels/useAccountViewModel";
import { PageBar } from "../layout/PageBar";
import { DetailCard } from "../primitives/DetailCard";
import { LinkRow } from "../primitives/LinkRow";
import { StateBlock } from "../primitives/StateBlock";

export function AccountDetailsScreen() {
  const vm = useAccountDetailsViewModel();

  return (
    <div className="onboarding-page account-details-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Account options" />

      {vm.isLoading && <StateBlock tone="loading" message="Loading your account…" />}
      {vm.error && <StateBlock tone="error" message={vm.error} />}

      {!vm.isLoading && !vm.error && (
        <>
          <section className="activity-intro">
            <span className="status-chip">{vm.statusLabel}</span>
            <h1>{vm.walletLabel}</h1>
          </section>

          <DetailCard label="Account details" rows={vm.rows} />

          <section className="money-field">
            <span className="field-label">More</span>
            <div className="control-list">
              {vm.links.map((link) => (
                <LinkRow
                  key={link.id}
                  icon={link.icon as IconName}
                  title={link.title}
                  detail={link.detail}
                  onClick={() => vm.open(link.id)}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
