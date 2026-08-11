import { useBillEntryViewModel } from "@/core/viewmodels/useBillsViewModel";
import { PageBar } from "../layout/PageBar";
import { AmountField } from "../money/AmountField";
import { Icon } from "../primitives/Icon";
import { StateBlock } from "../primitives/StateBlock";

export function BillEntryScreen() {
  const vm = useBillEntryViewModel();

  return (
    <div className="onboarding-page money-page bill-entry-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Bill options" />

      {!vm.isReady ? (
        <StateBlock
          tone="empty"
          title="No biller chosen"
          message="Pick a biller from the Pay tab to start a payment."
          action={{ label: "Go back", onPress: vm.back }}
        />
      ) : (
        <>
          <section className="biller-hero">
            <span className="biller-icon">
              <Icon name={vm.billerIcon} />
            </span>
            <h1>{vm.billerName}</h1>
            <small>
              {vm.billerDetail} · {vm.billerDue}
            </small>
          </section>

          <label className="money-note">
            <span className="field-label">Account number</span>
            <span className="input-shell">
              <Icon name="receipt" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Your account with this biller"
                aria-label="Biller account number"
                value={vm.accountNumber}
                onChange={(event) => vm.setAccountNumber(event.target.value)}
              />
            </span>
          </label>

          <button
            className="secondary-button verify-button"
            type="button"
            disabled={!vm.canValidate}
            onClick={() => void vm.validate()}
          >
            {vm.isValidating ? "Checking with the biller…" : "Check this account"}
          </button>

          {vm.accountName && (
            <p className="verified-name" role="status">
              <Icon name="check" />
              <span>
                {vm.accountName}
                {vm.amountDueLabel ? ` · ${vm.amountDueLabel} due` : ""}
              </span>
            </p>
          )}

          {vm.accountName && (
            <AmountField
              label="Amount to pay"
              value={vm.amount}
              onChange={vm.setAmount}
              available={vm.availableLabel}
              presets={[]}
              selectedPresetId={null}
              onSelectPreset={vm.setAmount}
            />
          )}

          {vm.error && (
            <p className="transfer-error" role="alert">
              {vm.error}
            </p>
          )}

          <div className="money-actions">
            <button className="primary-button" type="button" disabled={!vm.canContinue} onClick={vm.review}>
              Continue
            </button>
          </div>
        </>
      )}
    </div>
  );
}
