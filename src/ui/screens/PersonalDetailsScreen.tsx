import { usePersonalDetailsViewModel } from "@/core/viewmodels/useProfileViewModel";
import { PageBar } from "../layout/PageBar";
import { DetailCard } from "../primitives/DetailCard";
import { PinField } from "../primitives/PinField";
import { LinkRow } from "../primitives/LinkRow";

export function PersonalDetailsScreen() {
  const vm = usePersonalDetailsViewModel();

  return (
    <div className="onboarding-page settings-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Personal details options" />

      {vm.editing === null ? (
        <>
          <section className="activity-intro">
            <p>{vm.intro}</p>
          </section>

          {vm.savedLabel && (
            <p className="activity-state" role="status">
              {vm.savedLabel}
            </p>
          )}

          <section className="money-field">
            <span className="field-label">Your details</span>
            <div className="control-list">
              {vm.rows.map((row) => (
                <LinkRow
                  key={row.id}
                  icon={row.icon}
                  title={row.label}
                  detail={row.value}
                  onClick={() => vm.edit(row.id)}
                />
              ))}
            </div>
          </section>

          <DetailCard label="Account standing" rows={vm.readOnlyRows} />
        </>
      ) : vm.isVerifying ? (
        <>
          <section className="activity-intro">
            <h1>Confirm it is you</h1>
            <p>{vm.verifyIntro}</p>
            <small>{vm.expiresLabel}</small>
          </section>

          <PinField label="One-time code" value={vm.code} onChange={vm.setCode} digits={vm.digits} />

          {vm.error && (
            <p className="transfer-error" role="alert">
              {vm.error}
            </p>
          )}

          <div className="money-actions">
            <button className="primary-button" type="button" disabled={!vm.canVerify} onClick={() => void vm.verify()}>
              {vm.isWorking ? "Checking your code…" : `Save ${vm.editingLabel.toLowerCase()}`}
            </button>
            <button className="text-button" type="button" onClick={vm.cancel}>
              Cancel
            </button>
            <p className="prototype-note">{vm.hint}</p>
          </div>
        </>
      ) : (
        <>
          <section className="activity-intro">
            <h1>{vm.editingLabel}</h1>
            <p>
              {vm.editing === "fullName"
                ? "This is the name we show you around the app."
                : "Changing this needs a one-time code, because it is where those codes go."}
            </p>
          </section>

          <label className="money-note">
            <span className="field-label">{vm.editingLabel}</span>
            <input
              className="input-shell"
              type={vm.editing === "email" ? "email" : vm.editing === "mobile" ? "tel" : "text"}
              inputMode={vm.editing === "mobile" ? "tel" : undefined}
              autoComplete={vm.editing === "email" ? "email" : vm.editing === "mobile" ? "tel" : "name"}
              aria-label={vm.editingLabel}
              value={vm.draft}
              onChange={(event) => vm.setDraft(event.target.value)}
            />
          </label>

          {vm.error && (
            <p className="transfer-error" role="alert">
              {vm.error}
            </p>
          )}

          <div className="money-actions">
            <button className="primary-button" type="button" disabled={!vm.canSave} onClick={() => void vm.save()}>
              {vm.isWorking ? "Sending your code…" : "Save"}
            </button>
            <button className="text-button" type="button" onClick={vm.cancel}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
