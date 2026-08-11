import { useStatementsViewModel } from "@/core/viewmodels/useComplianceViewModel";
import { PageBar } from "../layout/PageBar";
import { LinkRow } from "../primitives/LinkRow";
import { StateBlock } from "../primitives/StateBlock";

export function StatementsScreen() {
  const vm = useStatementsViewModel();

  return (
    <div className="onboarding-page statements-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Statement options" />

      {vm.isLoading && <StateBlock tone="loading" message="Loading your statements…" />}

      {vm.error && (
        <StateBlock
          tone="error"
          message={vm.error}
          action={vm.verifyPrompt ? { label: "Finish verification", onPress: vm.verifyPrompt } : undefined}
        />
      )}

      {!vm.isLoading && !vm.error && vm.items.length > 0 && (
        <section className="money-field">
          <span className="field-label">Monthly statements</span>
          <div className="control-list">
            {vm.items.map((item) => (
              <LinkRow
                key={item.id}
                icon="receipt"
                title={item.title}
                detail={item.detail}
                meta={item.closingLabel}
                onClick={() => vm.download(item.title)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
