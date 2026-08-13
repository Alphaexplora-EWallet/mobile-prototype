import { useEffect, useRef } from "react";
import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";
import { PageBar } from "../layout/PageBar";
import { SourcePicker } from "../cards/SourcePicker";
import { AmountField } from "../money/AmountField";
import { useDepositViewModel } from "@/core/viewmodels/useMoneyMovementViewModel";

const STEP_TITLE: Readonly<Record<1 | 2, string>> = { 1: "Choose a method", 2: "Amount" };

export function DepositScreen() {
  const vm = useDepositViewModel();
  const { cards, amount } = vm;
  const destination = vm.source;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [vm.step]);

  return (
    <div className="onboarding-page money-page deposit-page">
      <h1 className="sr-only" tabIndex={-1} ref={headingRef}>
        {STEP_TITLE[vm.step]}
      </h1>
      <PageBar title="Add money" onBack={vm.back} optionsLabel="Deposit options" />

      <div className="capture-progress">
        <span className="field-label">Step {vm.step} of 2</span>
        <div
          className="progress-track"
          role="progressbar"
          aria-label={`Step ${vm.step} of 2`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={vm.step === 1 ? 50 : 100}
        >
          <span style={{ width: `${vm.step === 1 ? 50 : 100}%` }} />
        </div>
      </div>

      {vm.step === 1 && (
        <section className="money-field">
          <span className="field-label">Choose a method</span>
          {vm.methodGroups
            .filter((group) => group.methods.length > 0)
            .map((group) => (
              <div className="biller-group" key={group.label}>
                <span className="field-label">{group.label}</span>
                <div className="control-list">
                  {group.methods.map((item) => (
                    <LinkRow
                      key={item.id}
                      icon={item.icon}
                      title={item.title}
                      detail={item.inbound ? `${item.detail}. You'll get an account number to send to.` : item.detail}
                      selected={vm.selectedMethod === item.id}
                      onClick={() => vm.selectMethod(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
        </section>
      )}

      {vm.step === 2 && (
        <>
          <SourcePicker label="To" cards={[...cards]} selected={destination.id} onSelect={vm.selectCard} />
          <AmountField
            label="Amount to add"
            value={amount}
            onChange={vm.setAmount}
            available={destination.balanceLabel}
            presets={vm.presets}
            selectedPresetId={vm.selectedPresetId}
            onSelectPreset={vm.selectPreset}
          />

          {/*
           * Both lines come from the selected method now. They read exactly as the
           * hardcoded pair did for the default (linked bank), and tell the truth for
           * the others — over the counter really does charge ₱20.
           */}
          <div className="summary-strip">
            <Icon name="arrow-down" />
            <span>
              <strong>{vm.feeLabel}</strong>
              <small>{vm.arrivalLabel}</small>
            </span>
          </div>
        </>
      )}

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canAdvance} onClick={vm.advance}>
          {vm.step === 1 ? vm.step1ActionLabel : "Add money"}
        </button>
        {vm.step === 2 && <p className="prototype-note">{vm.simulatedNote}</p>}
      </div>
    </div>
  );
}
