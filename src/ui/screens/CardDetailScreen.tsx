import { useCardDetailViewModel } from "@/core/viewmodels/useAccountViewModel";
import { PageBar } from "../layout/PageBar";
import { DetailCard } from "../primitives/DetailCard";
import { LinkRow } from "../primitives/LinkRow";

export function CardDetailScreen() {
  const vm = useCardDetailViewModel();

  return (
    <div className="onboarding-page card-detail-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Card options" />

      <section className="activity-intro">
        <h1>{vm.cardLabel}</h1>
        <p className="card-number">{vm.maskedNumber}</p>
      </section>

      <DetailCard label="Card details" rows={vm.rows} />

      <section className="money-field">
        <span className="field-label">Manage</span>
        <div className="control-list">
          <LinkRow icon="lock" title="Change card PIN" detail="Set a new four-digit PIN" onClick={vm.changePin} />
          <LinkRow
            icon="snow"
            title="Report lost or stolen"
            detail="Freeze and order a replacement"
            onClick={vm.reportLost}
          />
          <LinkRow
            icon="card"
            title="Order a replacement"
            detail="Delivered in 5 to 7 banking days"
            onClick={vm.orderReplacement}
          />
        </div>
      </section>
    </div>
  );
}
