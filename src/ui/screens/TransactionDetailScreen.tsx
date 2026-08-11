import { useTransactionDetailViewModel } from "@/core/viewmodels/useActivityViewModel";
import { PageBar } from "../layout/PageBar";
import { DetailCard, type DetailRow } from "../primitives/DetailCard";
import { StateBlock } from "../primitives/StateBlock";

export function TransactionDetailScreen() {
  const vm = useTransactionDetailViewModel();
  const detail = vm.detail;

  const rows: readonly DetailRow[] = detail
    ? [
        { label: "From", value: detail.sourceLabel },
        ...(detail.recipientLabel ? [{ label: "To", value: detail.recipientLabel }] : []),
        { label: "Fee", value: detail.feeLabel },
        { label: "Reference", value: detail.reference },
        { label: "Note", value: detail.description },
      ]
    : [];

  return (
    <div className="onboarding-page transaction-detail-page">
      <PageBar title="Transaction" onBack={vm.back} optionsLabel="Transaction options" />

      {vm.isLoading && <StateBlock tone="loading" message="Loading transaction…" />}
      {vm.error && <StateBlock tone="error" message={vm.error} />}
      {!vm.isLoading && !vm.error && !detail && (
        <StateBlock
          tone="empty"
          message="Choose a transaction from your activity to see its details."
          action={{ label: "View activity", onPress: vm.viewActivity }}
        />
      )}
      {detail && (
        <>
          <section className="detail-hero">
            <span className="transaction-icon detail-icon">{detail.glyph}</span>
            <span className="status-chip">{detail.statusLabel}</span>
            <h1>{detail.name}</h1>
            <strong className={detail.incoming ? "positive" : ""}>{detail.amountLabel}</strong>
            <p>{detail.when}</p>
          </section>

          <DetailCard label="Transaction details" rows={rows} />

          <div className="receipt-actions detail-activity-button">
            <button className="secondary-button" type="button" onClick={vm.viewActivity}>
              View all activity
            </button>
            <button className="text-button" type="button" onClick={vm.dispute}>
              Something wrong? Dispute this
            </button>
          </div>
        </>
      )}
    </div>
  );
}
