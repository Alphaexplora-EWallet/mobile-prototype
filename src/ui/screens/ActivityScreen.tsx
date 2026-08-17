import { useActivityViewModel } from "@/core/viewmodels/useActivityViewModel";
import { PageBar } from "../layout/PageBar";
import { TransactionRow } from "../money/TransactionRow";
import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";
import { StateBlock } from "../primitives/StateBlock";

export function ActivityScreen() {
  const vm = useActivityViewModel();

  return (
    <div className="onboarding-page activity-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Activity options" />

      <section className="activity-intro">
        <p className="eyebrow">NetBank sandbox</p>
        <h1>All activity</h1>
        <p>{vm.intro}</p>
      </section>

      <section className="money-field insights-entry">
        <span className="field-label">Spending insights</span>
        <LinkRow
          icon="receipt"
          title="Monthly totals"
          detail="Break down spend by category and merchant"
          onClick={vm.openInsights}
        />
      </section>

      <label className="money-note activity-search">
        <span className="input-shell">
          <Icon name="qr" />
          <input
            type="search"
            placeholder="Search by name or reference"
            aria-label="Search activity"
            value={vm.search}
            onChange={(event) => vm.setSearch(event.target.value)}
          />
        </span>
      </label>

      <div className="activity-filters" role="group" aria-label="Filter activity">
        {vm.filters.map((option) => (
          <button
            type="button"
            className={option.selected ? "activity-filter is-selected" : "activity-filter"}
            key={option.id}
            aria-pressed={option.selected}
            onClick={() => vm.setFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {vm.isLoading && <StateBlock tone="loading" message="Loading your activity…" />}
      {vm.error && (
        <StateBlock
          tone="error"
          message={vm.error}
          action={{ label: "Try again", onPress: () => void vm.refresh(), variant: "text" }}
        />
      )}
      {!vm.isLoading && !vm.error && vm.items.length === 0 && (
        <StateBlock
          tone="empty"
          message={
            vm.isFiltered
              ? "Nothing matches that. Try a different search or filter."
              : "Your completed transfers and payments will appear here."
          }
        />
      )}
      {!vm.isLoading && vm.items.length > 0 && (
        <>
          <section className="transaction-list activity-list" aria-label="Transaction activity">
            {vm.items.map((item) => (
              <TransactionRow
                key={item.id}
                row={item}
                className="activity-row"
                onPress={() => vm.openTransaction(item.id)}
              />
            ))}
          </section>
          {vm.hasMore && (
            <button
              className="text-button"
              type="button"
              disabled={vm.isLoadingMore}
              onClick={() => void vm.loadMore()}
            >
              {vm.isLoadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
