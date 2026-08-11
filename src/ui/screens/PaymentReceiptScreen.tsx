import { usePaymentReceiptViewModel } from "@/core/viewmodels/usePaymentFlowViewModel";
import { PageBar } from "../layout/PageBar";
import { DetailCard } from "../primitives/DetailCard";
import { Icon } from "../primitives/Icon";
import { StateBlock } from "../primitives/StateBlock";

export function PaymentReceiptScreen() {
  const vm = usePaymentReceiptViewModel();

  return (
    <div className="onboarding-page payment-receipt-page">
      <PageBar title="Receipt" optionsLabel="Receipt options" />

      {!vm.isReady ? (
        <StateBlock
          tone="empty"
          title="No receipt yet"
          message="Complete a payment to create a receipt in the NetBank sandbox."
          action={{ label: "Go home", onPress: vm.done, variant: "primary" }}
        />
      ) : (
        <>
          <section className="receipt-hero">
            <span className={vm.settling ? "receipt-check is-pending" : "receipt-check"}>
              <Icon name={vm.settling ? "clock" : "check"} />
            </span>
            <h1>{vm.title}</h1>
            <strong className="receipt-amount">{vm.amountLabel}</strong>
            <strong>{vm.counterparty}</strong>
            <small>{vm.counterpartyDetail}</small>
          </section>

          <DetailCard label="Receipt details" className="receipt-card" rows={vm.rows} />

          <div className="receipt-actions">
            {vm.settling && (
              <button className="secondary-button" type="button" onClick={vm.trackStatus}>
                Track this transfer
              </button>
            )}
            <button className="secondary-button" type="button" onClick={vm.share}>
              Share receipt
            </button>
            {/*
             * Goes to this payment's detail, not the activity list. The label is
             * imprecise, but it is pinned by the golden-era flow test and the
             * destination is the more useful one right after paying.
             */}
            <button className="secondary-button" type="button" onClick={vm.viewActivity}>
              View activity
            </button>
            <button className="primary-button" type="button" onClick={vm.done}>
              Done
            </button>
          </div>
        </>
      )}
    </div>
  );
}
