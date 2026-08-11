import { useSpendingInsightsViewModel } from "@/core/viewmodels/useSpendingInsightsViewModel";
import { PageBar } from "../layout/PageBar";
import { SegmentedControl } from "../primitives/SegmentedControl";
import { StateBlock } from "../primitives/StateBlock";

/**
 * Monthly spend by category and merchant, derived purely from the activity
 * feed. The empty-state guard is the point: a month with no spend must show a
 * StateBlock, never a "₱0.00" total or an empty list pretending to be data.
 */
export function SpendingInsightsScreen() {
  const vm = useSpendingInsightsViewModel();

  return (
    <div className="onboarding-page insights-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Insights options" />

      <section className="activity-intro insights-intro">
        <p className="eyebrow">NetBank sandbox</p>
        <h1>Where your money went</h1>
        <p>{vm.intro}</p>
      </section>

      {vm.isLoading && <StateBlock tone="loading" message="Working out your spending…" />}
      {vm.error && (
        <StateBlock
          tone="error"
          message={vm.error}
          action={{ label: "Try again", onPress: () => void vm.refresh(), variant: "text" }}
        />
      )}

      {!vm.isLoading && !vm.error && (
        <>
          {vm.months.length > 1 && (
            <SegmentedControl
              label="Choose a month"
              options={vm.months}
              selectedId={vm.selectedMonthId}
              onSelect={vm.selectMonth}
            />
          )}

          {vm.isEmpty ? (
            <StateBlock tone="empty" message={vm.emptyMessage} />
          ) : (
            <>
              <section className="insights-total" aria-label={`Total spent in ${vm.selectedMonthLabel}`}>
                <span className="field-label">Total spent · {vm.selectedMonthLabel}</span>
                <strong>{vm.totalLabel}</strong>
              </section>

              <section className="insights-section" aria-label="Spend by category">
                <h2>By category</h2>
                <div className="insight-list">
                  {vm.categories.map((group) => (
                    <div className="insight-row" key={group.key}>
                      <span className="insight-glyph">{group.glyph}</span>
                      <span className="insight-copy">
                        <strong>{group.label}</strong>
                        <small>{group.countLabel}</small>
                      </span>
                      <strong className="insight-total">{group.totalLabel}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="insights-section" aria-label="Spend by merchant">
                <h2>By merchant</h2>
                <div className="insight-list">
                  {vm.merchants.map((group) => (
                    <div className="insight-row" key={group.key}>
                      <span className="insight-glyph">{group.glyph}</span>
                      <span className="insight-copy">
                        <strong>{group.label}</strong>
                        <small>{group.countLabel}</small>
                      </span>
                      <strong className="insight-total">{group.totalLabel}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
