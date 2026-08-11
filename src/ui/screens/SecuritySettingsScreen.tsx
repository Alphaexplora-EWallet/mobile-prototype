import { useSecuritySettingsViewModel } from "@/core/viewmodels/useSettingsViewModel";
import { PageBar } from "../layout/PageBar";
import { ControlRow } from "../primitives/ControlRow";
import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";
import { StateBlock } from "../primitives/StateBlock";
import { Toggle } from "../primitives/Toggle";

export function SecuritySettingsScreen() {
  const vm = useSecuritySettingsViewModel();

  return (
    <div className="onboarding-page settings-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Security options" />

      <section className="money-field">
        <span className="field-label">Confirming payments</span>
        <div className="control-list">
          <LinkRow
            icon="lock"
            title="Transaction PIN"
            detail="Asked for whenever money leaves for another bank"
            onClick={vm.changePin}
          />
          <ControlRow
            icon="user"
            title="Biometrics"
            detail="Use your face or fingerprint instead of the PIN"
            trailing={<Toggle checked={vm.biometricsEnabled} onChange={vm.setBiometrics} label="Biometrics" />}
          />
        </div>
      </section>

      <section className="money-field">
        <span className="field-label">Where you are signed in</span>
        {vm.isLoading && <StateBlock tone="loading" message="Loading your sessions…" />}
        {vm.error && <StateBlock tone="error" message={vm.error} />}
        {!vm.isLoading && (
          <div className="control-list">
            {vm.sessions.map((session) => (
              <div className="control-row" key={session.id}>
                <span className="control-icon">
                  <Icon name="lock" />
                </span>
                <span className="control-copy">
                  <strong>{session.deviceName}</strong>
                  <small>{session.detail}</small>
                </span>
                {session.current ? (
                  <strong className="session-current">This device</strong>
                ) : (
                  <button
                    className="text-button danger-button session-revoke"
                    type="button"
                    onClick={() => void vm.revoke(session.id)}
                  >
                    Sign out
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
