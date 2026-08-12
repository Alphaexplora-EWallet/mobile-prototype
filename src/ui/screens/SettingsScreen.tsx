import { useSettingsViewModel } from "@/core/viewmodels/useSettingsViewModel";
import { PageBar } from "../layout/PageBar";
import { ControlRow } from "../primitives/ControlRow";
import { Toggle } from "../primitives/Toggle";

export function SettingsScreen() {
  const vm = useSettingsViewModel();

  return (
    <div className="onboarding-page settings-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Settings options" />

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
