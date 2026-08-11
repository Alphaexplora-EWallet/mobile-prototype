import type { IconName } from "@/core/domain/icons";
import { useSettingsViewModel } from "@/core/viewmodels/useSettingsViewModel";
import { PageBar } from "../layout/PageBar";
import { ControlRow } from "../primitives/ControlRow";
import { LinkRow } from "../primitives/LinkRow";
import { Toggle } from "../primitives/Toggle";

export function SettingsScreen() {
  const vm = useSettingsViewModel();

  return (
    <div className="onboarding-page settings-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Settings options" />

      <section className="money-field">
        <span className="field-label">Account</span>
        <div className="control-list">
          {vm.accountRows.map((row) => (
            <LinkRow
              key={row.id}
              icon={row.icon as IconName}
              title={row.title}
              detail={row.detail}
              onClick={() => vm.open(row.id)}
            />
          ))}
        </div>
      </section>

      <section className="money-field">
        <span className="field-label">App</span>
        <div className="control-list">
          {vm.appRows.map((row) => (
            <LinkRow
              key={row.id}
              icon={row.icon as IconName}
              title={row.title}
              detail={row.detail}
              meta={row.id === "notifications" ? vm.unreadLabel : undefined}
              onClick={() => vm.open(row.id)}
            />
          ))}
        </div>
      </section>

      <section className="money-field">
        <span className="field-label">Appearance and privacy</span>
        <div className="control-list">
          <ControlRow
            icon="contrast"
            title="Dark mode"
            detail="Follows your choice, not the system"
            trailing={<Toggle checked={vm.darkMode} onChange={vm.setDarkMode} label="Dark mode" />}
          />
          <ControlRow
            icon="eye"
            title="Show balances"
            detail="Hide amounts on the home screen"
            trailing={<Toggle checked={vm.balanceVisible} onChange={vm.setBalanceVisible} label="Show balances" />}
          />
        </div>
      </section>
    </div>
  );
}
