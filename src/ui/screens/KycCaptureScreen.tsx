import { useKycCaptureViewModel } from "@/core/viewmodels/useComplianceViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";

/** One capture step: a framed placeholder and the button that marks it done. */
function CaptureStep({
  label,
  hint,
  done,
  onCapture,
}: {
  label: string;
  hint: string;
  done: boolean;
  onCapture: () => void;
}) {
  return (
    <section className="capture-step">
      <span className={done ? "capture-frame is-done" : "capture-frame"} aria-hidden="true">
        <Icon name={done ? "check" : "card"} />
      </span>
      <h2>{label}</h2>
      <p>{hint}</p>
      <button className="secondary-button" type="button" onClick={onCapture}>
        {done ? "Retake" : "Capture"}
      </button>
    </section>
  );
}

export function KycCaptureScreen() {
  const vm = useKycCaptureViewModel();

  return (
    <div className="onboarding-page kyc-capture-page">
      <PageBar title={vm.title} onBack={vm.previous} optionsLabel="Verification options" />

      <div className="capture-progress">
        <span className="field-label">{vm.stepLabel}</span>
        <div className="progress-track" aria-label={vm.stepLabel}>
          <span style={{ width: `${vm.progressPercent}%` }} />
        </div>
      </div>

      {vm.step === "document" && (
        <section className="money-field">
          <span className="field-label">Which ID will you use?</span>
          <div className="control-list">
            {vm.documents.map((option) => (
              <LinkRow
                key={option.id}
                icon="user"
                title={option.title}
                detail={option.detail}
                selected={option.selected}
                onClick={() => vm.selectDocument(option.id)}
              />
            ))}
          </div>
        </section>
      )}

      {vm.step === "front" && (
        <CaptureStep
          label={`Front of your ${vm.documentName}`}
          hint="Lay it flat, fill the frame, and keep the whole card in shot."
          done={vm.captured.front}
          onCapture={() => vm.capture("frontCaptured")}
        />
      )}

      {vm.step === "back" && vm.needsBack && (
        <CaptureStep
          label={`Back of your ${vm.documentName}`}
          hint="Make sure the signature strip and any barcode are readable."
          done={vm.captured.back}
          onCapture={() => vm.capture("backCaptured")}
        />
      )}

      {vm.step === "selfie" && (
        <CaptureStep
          label="Take a selfie"
          hint="Face the light, remove hats and glasses, and look straight ahead."
          done={vm.captured.selfie}
          onCapture={() => vm.capture("selfieCaptured")}
        />
      )}

      {vm.step === "address" && (
        <section className="money-field address-step">
          <span className="field-label">Where do you live?</span>
          <label className="money-note">
            <span className="input-shell">
              <Icon name="home" />
              <input
                type="text"
                placeholder="House number and street"
                aria-label="Street address"
                value={vm.address.line}
                onChange={(event) => vm.setAddress("addressLine", event.target.value)}
              />
            </span>
          </label>
          <label className="money-note">
            <span className="input-shell">
              <Icon name="globe" />
              <input
                type="text"
                placeholder="City"
                aria-label="City"
                value={vm.address.city}
                onChange={(event) => vm.setAddress("city", event.target.value)}
              />
            </span>
          </label>
          <label className="money-note">
            <span className="input-shell">
              <Icon name="mail" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Postal code"
                aria-label="Postal code"
                value={vm.address.postalCode}
                onChange={(event) => vm.setAddress("postalCode", event.target.value)}
              />
            </span>
          </label>
        </section>
      )}

      {vm.error && (
        <p className="transfer-error" role="alert">
          {vm.error}
        </p>
      )}

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canAdvance} onClick={() => void vm.advance()}>
          {vm.isSubmitting ? "Sending for review…" : vm.isLast ? "Submit for review" : "Continue"}
        </button>
      </div>
    </div>
  );
}
