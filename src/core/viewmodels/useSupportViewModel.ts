import { useState } from "react";
import type { BankingTransaction } from "../domain/banking";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { useActivityStore } from "../stores/activity.store";
import { settingsActions, useSettingsStore } from "../stores/settings.store";
import { uiActions } from "../stores/ui.store";

const HELP_TOPICS = [
  {
    id: "arrival",
    question: "When will my transfer arrive?",
    answer:
      "FIN-A to FIN-A is instant. InstaPay clears in seconds, any time. PESONet moves in batches and credits within the same banking day if you send before the 3:00 PM cut-off.",
  },
  {
    id: "wrong-account",
    question: "I sent money to the wrong account",
    answer:
      "Once a rail accepts a transfer it cannot be recalled. Check the account name we show before confirming — that check exists for exactly this. If it has already gone, file a dispute below and we will contact the receiving bank.",
  },
  {
    id: "limits",
    question: "Why is my transfer blocked?",
    answer:
      "Each rail has a per-transaction cap and a daily limit that depend on your verification tier. Settings has the full table, and finishing verification raises them.",
  },
  {
    id: "returned",
    question: "My PESONet transfer came back",
    answer:
      "The receiving bank rejected it, usually because the account number and name did not match. The amount and the fee are returned to your wallet.",
  },
] as const;

export function useHelpViewModel() {
  const navigation = useNavigation();
  const openTopic = useSettingsStore((state) => state.openHelpTopic);
  const selectedTransactionId = useActivityStore((state) => state.selectedTransactionId);

  return {
    title: "Help",
    intro: "The questions this wallet gets asked most.",
    topics: HELP_TOPICS.map((topic) => ({
      id: topic.id,
      question: topic.question,
      answer: topic.answer,
      open: topic.id === openTopic,
    })),
    toggle: settingsActions.toggleHelpTopic,
    /** Disabled until a transaction has been opened — there is nothing to dispute. */
    canDispute: selectedTransactionId !== null,
    disputeHint:
      selectedTransactionId !== null
        ? "Dispute the transaction you last opened."
        : "Open a transaction from your activity first, then come back here.",
    dispute: () => navigation.navigate("dispute"),
    contact: () => uiActions.showSimulated("Contact support"),
    back: navigation.goBack,
  };
}

const REASONS = [
  { id: "not-received", label: "The recipient never got it" },
  { id: "wrong-amount", label: "The amount is wrong" },
  { id: "duplicate", label: "I was charged twice" },
  { id: "not-mine", label: "I did not make this payment" },
] as const;

export function useDisputeViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const transactionId = useActivityStore((state) => state.selectedTransactionId);

  const [reasonId, setReasonId] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filed, setFiled] = useState<BankingTransaction | null>(null);

  const reason = REASONS.find((entry) => entry.id === reasonId) ?? null;

  return {
    title: "Dispute a payment",
    isReady: transactionId !== null,
    reasons: REASONS.map((entry) => ({ id: entry.id, label: entry.label, selected: entry.id === reasonId })),
    selectReason: setReasonId,
    detail,
    setDetail,
    canSubmit: transactionId !== null && reason !== null && !isSubmitting && filed === null,
    isSubmitting,
    error,
    filed: filed !== null,
    confirmation: filed
      ? `We have logged your dispute against ${filed.reference}. Support will be in touch within two banking days.`
      : "",
    submit: async () => {
      if (!transactionId || !reason) return;
      setIsSubmitting(true);
      setError(null);
      const note = detail.trim() ? `${reason.label} — ${detail.trim()}` : reason.label;
      const result = await gateway.activity.dispute(transactionId, note);
      setIsSubmitting(false);
      if (result.ok) setFiled(result.value);
      else setError(result.error.message);
    },
    viewTransaction: () => navigation.navigate("transaction-detail"),
    back: navigation.goBack,
  };
}
