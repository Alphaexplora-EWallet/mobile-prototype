import { useQrScanViewModel } from "@/core/viewmodels/useQrViewModel";
import { PageBar } from "../layout/PageBar";
import { AmountField } from "../money/AmountField";
import { Icon } from "../primitives/Icon";

export function QrScanScreen() {
  const vm = useQrScanViewModel();

  return (
    <div className="onboarding-page money-page qr-scan-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Scan options" />

      {/* Main Camera Viewfinder Viewport */}
      <section className="camera-viewfinder-stage" aria-label="Camera viewfinder">
        {/* Animated Laser Scanning Line */}
        <div className="camera-laser-beam" aria-hidden="true" />

        {/* Viewfinder Reticle Frame */}
        <div className="camera-reticle-frame" aria-hidden="true">
          <div className="reticle-corner top-left" />
          <div className="reticle-corner top-right" />
          <div className="reticle-corner bottom-left" />
          <div className="reticle-corner bottom-right" />

          <div className="camera-qr-glyph">
            <Icon name="qr" />
          </div>
        </div>

        <p className="camera-viewfinder-caption">Position the QR code within the frame</p>
      </section>

      {/* Sleek Sandbox Quick Scan Chips */}
      <section className="sandbox-quick-section" aria-label="Codes in this sandbox">
        <span className="sandbox-quick-label">Tap code to scan:</span>
        <div className="sandbox-chips-row">
          {vm.sampleCodes.map((sample) => (
            <button
              key={sample.id}
              type="button"
              className="sandbox-chip-btn"
              onClick={() => void vm.useSample(sample.id)}
            >
              <span className="chip-icon-wrap">
                <Icon name="qr" />
              </span>
              <span className="chip-content">
                <strong>{sample.title}</strong>
                <small>{sample.detail}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Compact Manual Paste Input */}
      <div className="scan-manual-paste-box">
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
      </div>

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
