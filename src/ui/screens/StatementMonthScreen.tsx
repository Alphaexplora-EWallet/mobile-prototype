import { useStatementMonthViewModel } from "@/core/viewmodels/useStatementMonthViewModel";
import { PageBar } from "../layout/PageBar";
import { StateBlock } from "../primitives/StateBlock";

export function StatementMonthScreen() {
  const vm = useStatementMonthViewModel();

  return (
    <div className="onboarding-page statement-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Statement options" />

      {vm.isLoading && <StateBlock tone="loading" message="Loading this statement…" />}

      {vm.error && <StateBlock tone="error" message={vm.error} />}

      {vm.notFound && (
        <StateBlock
          tone="empty"
          message="No statement is selected. Go back and choose a month."
          action={{ label: "Back to statements", onPress: vm.back }}
        />
      )}

      {vm.summary && (
        <>
          <section className="statement-summary" aria-label="Statement summary">
            <p className="eyebrow">{vm.summary.generatedLabel}</p>
            <div className="statement-balance-row">
              <span>
                <small>Opening</small>
                <strong>{vm.summary.openingLabel}</strong>
              </span>
              <span>
                <small>Closing</small>
                <strong>{vm.summary.closingLabel}</strong>
              </span>
            </div>
            <p className="statement-count">{vm.summary.countLabel}</p>
          </section>

          <button
            type="button"
            className="primary-button statement-export-button"
            disabled={vm.exportState.status === "saving"}
            onClick={() => void vm.exportCsv()}
          >
            {vm.exportState.status === "saving" ? "Preparing CSV…" : "Export as CSV"}
          </button>

          {vm.exportState.status !== "idle" && (
            <p className="statement-export-status" role={vm.exportState.status === "error" ? "alert" : "status"}>
              {vm.exportState.status === "saved" && `Saved as ${vm.exportState.filename}`}
              {vm.exportState.status === "empty" && vm.exportState.message}
              {vm.exportState.status === "error" && vm.exportState.message}
            </p>
          )}

          {vm.isEmpty && (
            <StateBlock tone="empty" message={`No transactions in ${vm.title} — nothing moved this month.`} />
          )}

          {vm.entries.length > 0 && (
            <section className="statement-entries" aria-label={`${vm.title} transactions`}>
              {vm.entries.map((entry) => (
                <div className="statement-entry" key={entry.id}>
                  <span className="statement-entry-copy">
                    <strong>{entry.description}</strong>
                    <small>
                      {entry.date} · {entry.reference}
                    </small>
                  </span>
                  <span className="statement-entry-amounts">
                    <strong className={entry.incoming ? "positive" : ""}>{entry.amountLabel}</strong>
                    <small>{entry.balanceLabel}</small>
                  </span>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
