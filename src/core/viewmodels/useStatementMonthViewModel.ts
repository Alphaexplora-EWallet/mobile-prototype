import { useCallback, useEffect, useState } from "react";
import type { Statement } from "../domain/statement";
import { statementFilename, statementToCsv } from "../domain/statement";
import { formatMoney, formatSignedMoney } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { usePlatform } from "../platform/PlatformContext";
import { useStatementStore } from "../stores/statement.store";

/**
 * The export outcome, rendered as one status line under the button. `saved`
 * names the artifact the browser actually received, so the screen never has to
 * guess whether the download went through.
 */
export type StatementExportState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; filename: string }
  | { status: "empty"; message: string }
  | { status: "error"; message: string };

export function useStatementMonthViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const platform = usePlatform();
  const selectedStatementId = useStatementStore((state) => state.selectedStatementId);

  const [statements, setStatements] = useState<readonly Statement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportState, setExportState] = useState<StatementExportState>({ status: "idle" });

  useEffect(() => {
    let active = true;
    void gateway.accounts.statements().then((result) => {
      if (!active) return;
      if (result.ok) setStatements(result.value);
      else setError(result.error.message);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  const statement = statements.find((candidate) => candidate.id === selectedStatementId) ?? null;

  const exportCsv = useCallback(async () => {
    if (!statement) return;
    // An empty month must never ship a header-only file as if it were a real
    // statement — the button explains itself instead.
    if (statement.entries.length === 0) {
      setExportState({
        status: "empty",
        message: `${statement.periodLabel} has no transactions, so there is nothing to export.`,
      });
      return;
    }
    setExportState({ status: "saving" });
    const filename = statementFilename(statement);
    const saved = await platform.statementExport.saveCsv(filename, statementToCsv(statement));
    setExportState(
      saved
        ? { status: "saved", filename }
        : { status: "error", message: "This device refused the download. Try again." },
    );
  }, [platform, statement]);

  return {
    title: statement?.periodLabel ?? "Statement",
    isLoading,
    error,
    /** Covers a missing selection without crashing: show a way back. */
    notFound: !isLoading && !error && statement === null,
    summary: statement
      ? {
          generatedLabel: statement.generatedLabel,
          openingLabel: formatMoney(statement.openingBalance),
          closingLabel: formatMoney(statement.closingBalance),
          countLabel: `${statement.transactionCount} transactions`,
        }
      : null,
    entries:
      statement?.entries.map((entry, index) => ({
        id: `${statement.id}-${index}`,
        date: entry.date,
        description: entry.description,
        reference: entry.reference,
        amountLabel: formatSignedMoney(entry.amount),
        incoming: entry.amount.amount > 0,
        balanceLabel: formatMoney(entry.balance),
      })) ?? [],
    isEmpty: statement !== null && statement.entries.length === 0,
    exportState,
    exportCsv,
    back: navigation.goBack,
  };
}
