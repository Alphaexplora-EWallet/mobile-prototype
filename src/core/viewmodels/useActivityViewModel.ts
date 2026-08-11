import { useCallback, useEffect, useState } from "react";
import type { BankingTransaction } from "../domain/banking";
import { requestStatusLabel } from "../domain/request";
import { isIncoming } from "../domain/transaction";
import { formatMoney, formatSignedMoney } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import type { ActivityFilter } from "../stores/activity.store";
import { ACTIVITY_FILTER_KINDS, activityActions, useActivityStore } from "../stores/activity.store";
import { paymentActions } from "../stores/payment.store";
import { requestsActions, useRequestsStore } from "../stores/requests.store";
import { useSelectedCard } from "./useCardViews";

const statusLabel = (status: BankingTransaction["status"]): string => {
  if (status === "completed") return "Completed";
  if (status === "pending") return "Pending";
  if (status === "returned") return "Returned";
  return "Failed";
};

export type ActivityRowViewModel = {
  id: string;
  glyph: string;
  name: string;
  when: string;
  amountLabel: string;
  incoming: boolean;
  statusLabel: string;
};

const FILTER_LABELS: Readonly<Record<ActivityFilter, string>> = {
  all: "All",
  in: "Money in",
  out: "Money out",
  bills: "Bills and QR",
};

/** Page size. Small enough that "load more" is reachable with three fixtures. */
const PAGE_SIZE = 10;

export function useActivityViewModel() {
  const gateway = useBankingGateway();
  const navigation = useNavigation();
  const source = useSelectedCard();
  const search = useActivityStore((state) => state.search);
  const filter = useActivityStore((state) => state.filter);
  const requests = useRequestsStore((state) => state.requests);

  const [activity, setActivity] = useState<readonly BankingTransaction[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await gateway.activity.list({
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      kinds: ACTIVITY_FILTER_KINDS[filter],
    });
    if (result.ok) {
      setActivity(result.value.items);
      setCursor(result.value.nextCursor);
    }
    // The adapter owns the copy, so the screen shows its reason rather than a
    // generic one invented here.
    else setError(result.error.message);
    setIsLoading(false);
  }, [gateway, search, filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadMore = async () => {
    if (!cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    const result = await gateway.activity.list({
      cursor,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      kinds: ACTIVITY_FILTER_KINDS[filter],
    });
    if (result.ok) {
      // Appended, not replaced — this is a next page, not a new result set.
      setActivity((current) => [...current, ...result.value.items]);
      setCursor(result.value.nextCursor);
    } else setError(result.error.message);
    setIsLoadingMore(false);
  };

  return {
    title: "Activity",
    intro: "Every movement made through your wallet.",
    search,
    setSearch: activityActions.setSearch,
    filters: (Object.keys(FILTER_LABELS) as ActivityFilter[]).map((id) => ({
      id,
      label: FILTER_LABELS[id],
      selected: id === filter,
    })),
    setFilter: (id: string) => activityActions.setFilter(id as ActivityFilter),
    filter,
    /** Distinguishes "you have no activity" from "nothing matched your search". */
    isFiltered: search.trim().length > 0 || filter !== "all",
    hasMore: cursor !== undefined,
    isLoadingMore,
    loadMore,
    items: activity.map<ActivityRowViewModel>((transaction) => ({
      id: transaction.id,
      glyph: transaction.glyph,
      name: transaction.name,
      when: transaction.when,
      amountLabel: formatSignedMoney(transaction.amount),
      incoming: isIncoming(transaction),
      statusLabel: statusLabel(transaction.status),
    })),
    /**
     * Money requests are not bank activity — nothing moved yet — so they get
     * their own section above the transaction feed. Pending rows carry the
     * dev-only accept/reject actions that simulate the recipient's reply.
     */
    requests: requests.map((request) => ({
      id: request.id,
      initials: request.payer.initials,
      name: request.payer.name,
      amountLabel: formatMoney(request.amount),
      note: request.note || "No note",
      when: request.when,
      statusLabel: requestStatusLabel(request.status),
      isPending: request.status === "pending",
    })),
    acceptRequest: (id: string) => {
      const request = requests.find((candidate) => candidate.id === id);
      if (!request || request.status !== "pending") return;
      // Acceptance routes into the shared pipeline as the payer's payment. The
      // request flips to accepted only when that payment actually submits, so
      // abandoning review leaves it pending and the balance untouched.
      // Like cash-in, the credit lands on whichever card is selected at the
      // moment the payment executes — the request itself carries no card.
      paymentActions.start(
        {
          kind: "request",
          requestId: request.id,
          destinationCardId: source.id,
          destinationLabel: `${source.displayLabel} •••• ${source.last4}`,
          payer: request.payer,
          amount: request.amount,
          note: request.note,
        },
        gateway.nextIdempotencyKey(),
      );
      navigation.navigate("payment-review");
    },
    rejectRequest: (id: string) => requestsActions.markRejected(id),
    isLoading,
    error,
    refresh,
    openTransaction: (id: string) => {
      activityActions.selectTransaction(id);
      navigation.navigate("transaction-detail");
    },
    back: navigation.goBack,
  };
}

export function useTransactionDetailViewModel() {
  const gateway = useBankingGateway();
  const navigation = useNavigation();
  const selectedTransactionId = useActivityStore((state) => state.selectedTransactionId);
  const [transaction, setTransaction] = useState<BankingTransaction | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!selectedTransactionId) {
      setTransaction(null);
      return () => {
        active = false;
      };
    }

    setTransaction(undefined);
    setError(null);
    void gateway.activity.get(selectedTransactionId).then((result) => {
      if (!active) return;
      if (result.ok) setTransaction(result.value);
      else {
        setTransaction(null);
        setError(result.error.message);
      }
    });

    return () => {
      active = false;
    };
  }, [gateway, selectedTransactionId]);

  const detail = transaction
    ? {
        glyph: transaction.glyph,
        name: transaction.name,
        when: transaction.when,
        amountLabel: formatSignedMoney(transaction.amount),
        incoming: isIncoming(transaction),
        statusLabel: statusLabel(transaction.status),
        reference: transaction.reference,
        description: transaction.description,
        sourceLabel: transaction.sourceLabel ?? "FIN-A wallet",
        recipientLabel: transaction.recipient
          ? `${transaction.recipient.name} · ${transaction.recipient.handle}`
          : null,
        feeLabel: transaction.fee ? formatMoney(transaction.fee) : "₱0.00",
      }
    : null;

  return {
    detail,
    isLoading: transaction === undefined,
    error,
    back: navigation.goBack,
    /**
     * `navigate`, not `resetTo`. Resetting made a non-tab screen the stack root,
     * which hid the tab bar and left `PageBar`'s back arrow as a no-op — a dead
     * end you could only leave by reloading.
     */
    viewActivity: () => navigation.navigate("activity"),
    /** Disputes attach to a transaction, so this is the only place to start one. */
    dispute: () => navigation.navigate("dispute"),
  };
}
