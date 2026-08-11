import { useJarMoveViewModel } from "@/core/viewmodels/useJarMoveViewModel";
import { PageBar } from "../layout/PageBar";
import { SourcePicker } from "../cards/SourcePicker";
import { AmountField } from "../money/AmountField";
import { Icon } from "../primitives/Icon";

/**
 * The amount step for moving money into or out of the savings jar. Direction
 * lives in the jar draft store (set by the Wallet screen's jar face), so one
 * screen serves both ways — same trick as deposit/transfer sharing review.
 */
export function JarMoveScreen() {
  const vm = useJarMoveViewModel();

  return (
    <div className="onboarding-page money-page jar-move-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Jar options" />

      <SourcePicker
        label={vm.pickerLabel}
        cards={[...vm.cards]}
        selected={vm.selectedCardId}
        onSelect={vm.selectCard}
      />
      <AmountField
        label="Amount to move"
        value={vm.amount}
        onChange={vm.setAmount}
        available={vm.availableLabel}
        presets={vm.presets}
        selectedPresetId={vm.selectedPresetId}
        onSelectPreset={vm.selectPreset}
      />

      <div className="summary-strip">
        <Icon name="star" />
        <span>
          <strong>{vm.jarBalanceLabel} in your jar</strong>
          <small>{vm.jarDetail}</small>
        </span>
      </div>

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canContinue} onClick={vm.submit}>
          {vm.actionLabel}
        </button>
        <p className="prototype-note">{vm.simulatedNote}</p>
      </div>
    </div>
  );
}
