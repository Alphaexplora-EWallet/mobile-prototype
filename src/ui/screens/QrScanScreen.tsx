import { useQrScanViewModel } from "@/core/viewmodels/useQrViewModel";
import { PageBar } from "../layout/PageBar";
import { AmountField } from "../money/AmountField";
import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";

export function QrScanScreen() {
  const vm = useQrScanViewModel();

  return (
    <div className="onboarding-page money-page qr-scan-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Scan options" />

      <section className="viewfinder" aria-label="Camera viewfinder">
        <span className="viewfinder-frame" aria-hidden="true">
          <Icon name="qr" />
        </span>
        <p>{vm.cameraNote}</p>
      </section>

      <p className="activity-intro">{vm.intro}</p>

      <label className="money-note">
        <span className="field-label">Paste a QR PH code</span>
        <span className="input-shell">
          <Icon name="qr" />
          <input
            type="text"
            placeholder="Payload or reference"
            aria-label="QR PH code"
            value={vm.scanInput}
            onChange={(event) => vm.setScanInput(event.target.value)}
          />
        </span>
      </label>

      <button
        className="secondary-button verify-button"
        type="button"
        disabled={!vm.canDecode}
        onClick={() => void vm.decode()}
      >
        {vm.isDecoding ? "Reading the code…" : "Read this code"}
      </button>

      <section className="money-field">
        <span className="field-label">Codes in this sandbox</span>
        <div className="control-list">
          {vm.sampleCodes.map((sample) => (
            <LinkRow
              key={sample.id}
              icon="qr"
              title={sample.title}
              detail={sample.detail}
              onClick={() => void vm.useSample(sample.id)}
            />
          ))}
        </div>
      </section>

      {vm.error && (
        <p className="transfer-error" role="alert">
          {vm.error}
        </p>
      )}

      {vm.instruction && (
        <section className="decoded-code" aria-label="Decoded code">
          <span className="status-chip">Code read</span>
          <h2>{vm.instruction.merchantName}</h2>
          <small>
            {vm.instruction.merchantCity} · {vm.instruction.reference}
          </small>
          {vm.instruction.amountLabel && <strong>{vm.instruction.amountLabel}</strong>}
        </section>
      )}

      {vm.needsAmount && (
        <AmountField
          label="Amount to pay"
          value={vm.payAmount}
          onChange={vm.setPayAmount}
          available={vm.availableLabel}
          presets={[]}
          selectedPresetId={null}
          onSelectPreset={vm.setPayAmount}
        />
      )}

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canPay} onClick={vm.pay}>
          Continue
        </button>
        <button className="text-button" type="button" onClick={vm.showMyCode}>
          Show my QR code instead
        </button>
      </div>
    </div>
  );
}
