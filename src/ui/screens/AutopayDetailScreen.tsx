import { useAutopayDetailViewModel } from "@/core/viewmodels/useBillsViewModel";
import { PageBar } from "../layout/PageBar";
import { DetailCard } from "../primitives/DetailCard";
import { StateBlock } from "../primitives/StateBlock";

export function AutopayDetailScreen() {
  const vm = useAutopayDetailViewModel();

  return (
    <div className="onboarding-page autopay-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Autopay options" />

      {!vm.isReady ? (
        <StateBlock
          tone="empty"
          title="No schedule selected"
          message="Choose a scheduled payment from the Pay tab."
          action={{ label: "Go back", onPress: vm.back }}
        />
      ) : (
        <>
          <section className="detail-hero">
            <span className="transaction-icon detail-icon">{vm.glyph}</span>
            <span className="status-chip">{vm.statusLabel}</span>
            <h1>{vm.title}</h1>
            <strong>{vm.amountLabel}</strong>
          </section>

          <DetailCard label="Autopay details" rows={vm.rows} />

          <div className="receipt-actions">
            <button className="secondary-button" type="button" onClick={vm.togglePause}>
              {vm.paused ? "Resume autopay" : "Pause autopay"}
            </button>
            <button className="text-button danger-button" type="button" onClick={vm.cancel}>
              Cancel this autopay
            </button>
          </div>
        </>
      )}
    </div>
  );
}
