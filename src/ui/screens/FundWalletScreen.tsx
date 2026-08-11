import { useFundWalletViewModel } from "@/core/viewmodels/useFundWalletViewModel";
import { PageBar } from "../layout/PageBar";
import { DetailCard } from "../primitives/DetailCard";
import { Icon } from "../primitives/Icon";
import { StateBlock } from "../primitives/StateBlock";

export function FundWalletScreen() {
  const vm = useFundWalletViewModel();

  return (
    <div className="onboarding-page fund-wallet-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Funding options" />

      <section className="activity-intro">
        <p className="eyebrow">Incoming</p>
        <h1>Your account number</h1>
        <p>{vm.intro}</p>
      </section>

      {vm.isLoading && <StateBlock tone="loading" message="Loading your account details…" />}
      {vm.error && <StateBlock tone="error" message={vm.error} />}

      {vm.account && (
        <>
          <section className="virtual-account" aria-label="Virtual account number">
            <span className="field-label">Account number</span>
            <strong>{vm.account.accountNumberLabel}</strong>
            <button className="secondary-button" type="button" onClick={() => void vm.copyAccountNumber()}>
              <Icon name={vm.copied ? "check" : "receipt"} />
              {vm.copied ? "Copied" : "Copy account number"}
            </button>
          </section>

          <DetailCard
            label="Account details"
            rows={[
              { label: "Account name", value: vm.account.accountName },
              { label: "Bank", value: vm.account.bankName },
              { label: "Send via", value: vm.account.railsLabel },
              { label: "Credits to", value: vm.walletLabel },
            ]}
          />

          <section className="funding-steps" aria-label="How to send">
            <h2>How to send</h2>
            <ol>
              {vm.account.instructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
