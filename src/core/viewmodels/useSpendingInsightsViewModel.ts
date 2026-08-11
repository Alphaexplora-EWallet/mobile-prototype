import { useCallback, useEffect, useState } from "react";
import type { BankingTransaction } from "../domain/banking";
import { buildMonthSpend, monthLabel, spendMonths, type SpendGroup } from "../domain/spendingInsights";
import { formatMoney } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";

/**
 * The insights screen derives everything from the activity feed the Activity
 * screen already renders — no separate data source, so the two screens can
 * never disagree about what happened. The month selection is screen-local
 * state: it is a preference within one visit, not resumable flow state, so it
 * lives here rather than in a store.
 */

/**
 * The demo feed is a handful of fixtures, so one page covers it. The Activity
 * screen already demonstrates real pagination; insights needs the whole feed
 * to derive months and totals, and a real backend would page or aggregate
 * server-side.
 */
const FEED_LIMIT = 500;

export type SpendRowViewModel = {
  key: string;
  glyph: string;
  label: string;
  countLabel: string;
  totalLabel: string;
};

export function useSpendingInsightsViewModel() {
  const gateway = useBankingGateway();
  const navigation = useNavigation();

  const [transactions, setTransactions] = useState<readonly BankingTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await gateway.activity.list({ limit: FEED_LIMIT });
    if (result.ok) setTransactions(result.value.items);
    // The adapter owns the copy, so the screen shows its reason verbatim.
    else setError(result.error.message);
    setIsLoading(false);
  }, [gateway]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const months = spendMonths(transactions);
  // Keep the user's pick while that month still exists in the data; otherwise
  // fall back to the newest. Clamped at render time, not in an effect.
  const monthId = selectedMonthId && months.includes(selectedMonthId) ? selectedMonthId : (months[0] ?? null);
  const spend = monthId ? buildMonthSpend(transactions, monthId) : null;
  const hasSpend = spend !== null && spend.categories.length > 0;

  const rows = (groups: readonly SpendGroup[]): SpendRowViewModel[] =>
    groups.map((group) => ({
      key: group.key,
      glyph: group.glyph,
      label: group.label,
      countLabel: `${group.count} ${group.count === 1 ? "payment" : "payments"}`,
      totalLabel: formatMoney(group.total),
    }));

  return {
    title: "Spending insights",
    intro: "Where your money went, grouped by category and by merchant.",
    isLoading,
    error,
    refresh,
    months: months.map((id) => ({ id, label: monthLabel(id) })),
    selectedMonthId: monthId,
    selectedMonthLabel: spend?.monthLabel ?? null,
    selectMonth: (id: string) => setSelectedMonthId(id),
    /**
     * Total is absent (not "₱0.00") when nothing was spent — the empty state
     * replaces the whole breakdown, so no zero/NaN artifact can render.
     */
    totalLabel: hasSpend && spend ? formatMoney(spend.totalSpent) : null,
    categories: spend ? rows(spend.categories) : [],
    merchants: spend ? rows(spend.merchants) : [],
    isEmpty: spend === null || spend.categories.length === 0,
    emptyMessage:
      spend === null
        ? "No transactions yet — your monthly breakdown will appear here once money moves."
        : spend.transactionCount === 0
          ? `No transactions in ${spend.monthLabel}, so there is nothing to break down.`
          : `Nothing went out in ${spend.monthLabel} — money only came in.`,
    back: navigation.goBack,
  };
}
