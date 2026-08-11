import { useQrReceiveViewModel } from "@/core/viewmodels/useQrViewModel";
import { PageBar } from "../layout/PageBar";
import { AmountField } from "../money/AmountField";
import { Icon } from "../primitives/Icon";
import { StateBlock } from "../primitives/StateBlock";
import { QrCode } from "../money/QrCode";

export function QrReceiveScreen() {
  const vm = useQrReceiveViewModel();

  return (
    <div className="onboarding-page money-page qr-receive-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="QR options" />

      <section className="activity-intro">
        <p className="eyebrow">Get paid</p>
        <h1>Ask for money</h1>
        <p>{vm.intro}</p>
      </section>

      {vm.isLoading && <StateBlock tone="loading" message="Building your code…" />}
      {vm.error && <StateBlock tone="error" message={vm.error} />}

      {vm.code && (
        <section className="qr-card" aria-label="Your QR PH code">
          <QrCode matrix={vm.code.matrix} title={`QR code for ${vm.code.merchantName}`} />
          <strong>{vm.code.merchantName}</strong>
          <span className="qr-amount">{vm.code.amountLabel}</span>
          <small>{vm.code.expiresLabel}</small>
          <p className="qr-sandbox-note">{vm.sandboxNote}</p>
          <code className="qr-payload">{vm.code.payload}</code>
          <button className="secondary-button" type="button" onClick={() => void vm.copyPayload()}>
            <Icon name={vm.copied ? "check" : "receipt"} />
            {vm.copied ? "Copied" : "Copy payload"}
          </button>
        </section>
      )}

      <AmountField
        label="Amount to request"
        value={vm.amount}
        onChange={vm.setAmount}
        available={vm.walletLabel}
        presets={[]}
        selectedPresetId={null}
        onSelectPreset={vm.setAmount}
      />

      <label className="money-note">
        <span className="field-label">Note (optional)</span>
        <span className="input-shell">
          <Icon name="mail" />
          <input
            type="text"
            placeholder="What is this for?"
            value={vm.note}
            onChange={(event) => vm.setNote(event.target.value)}
          />
        </span>
      </label>
    </div>
  );
}
