import { useCallback, useEffect, useState } from "react";
import { syncBalances } from "../app/syncBalances";
import { isSettling, type PaymentReceipt } from "../domain/banking";
import {
  intentCardLabel,
  intentCounterparty,
  intentCounterpartyDetail,
  intentNote,
  requiresStepUp,
} from "../domain/paymentIntent";
import { railName } from "../domain/rails";
import { NO_CONFIRMATION_REQUIRED, TRANSACTION_PIN_LENGTH } from "../domain/security";
import { formatMoney } from "../money/format";
import { pesos } from "../money/money";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { activityActions } from "../stores/activity.store";
import { paymentActions, usePaymentStore } from "../stores/payment.store";
import { transferActions } from "../stores/transfer.store";
import { uiActions } from "../stores/ui.store";

/**
 * Copy for the one pipeline, keyed on what the payment is. This is the whole
 * reason four review screens collapsed into one.
 *
 * `transfer` wording is fixed by the golden-era test: the receipt heading must
 * stay "Transfer complete".
 */
const COPY = {
  transfer: {
    reviewTitle: "Review transfer",
    reviewLead: "You’re sending",
    receiptTitle: "Transfer complete",
    pendingTitle: "Transfer on its way",
    action: "Confirm and send",
    submitting: "Sending securely…",
  },
  "cash-in": {
    reviewTitle: "Review cash in",
    reviewLead: "You’re adding",
    receiptTitle: "Money added",
    pendingTitle: "Cash in on its way",
    action: "Confirm and add",
    submitting: "Adding securely…",
  },
  bill: {
    reviewTitle: "Review payment",
    reviewLead: "You’re paying",
    receiptTitle: "Bill paid",
    pendingTitle: "Payment on its way",
    action: "Confirm and pay",
    submitting: "Paying securely…",
  },
  qr: {
    reviewTitle: "Review payment",
    reviewLead: "You’re paying",
    receiptTitle: "Payment complete",
    pendingTitle: "Payment on its way",
    action: "Confirm and pay",
    submitting: "Paying securely…",
  },
} as const;

/**
 * Submitting, shared by review (when nothing steps up) and confirm (when
 * something does). Both paths must reuse the one idempotency key from the store,
 * which is why neither mints its own.
 */
function usePaymentSubmit() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const intent = usePaymentStore((state) => state.intent);
  const idempotencyKey = usePaymentStore((state) => state.idempotencyKey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (confirmation: string) => {
    if (!intent || !idempotencyKey || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const result = await gateway.payments.submit(intent, idempotencyKey, confirmation);
    if (!result.ok) {
      setError(result.error.message);
      setIsSubmitting(false);
      return;
    }

    paymentActions.setReceipt(result.value);
    await syncBalances(gateway);
    setIsSubmitting(false);
    navigation.navigate("payment-receipt");
  };

  return { submit, isSubmitting, error, setError, intent };
}

export function usePaymentReviewViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const quote = usePaymentStore((state) => state.quote);
  const { submit, isSubmitting, error, setError, intent } = usePaymentSubmit();
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!intent) return;
    let active = true;
    void gateway.payments.quote(intent).then((result) => {
      if (!active) return;
      paymentActions.setQuote(result.ok ? result.value : null);
      setQuoteError(result.ok ? null : result.error.message);
    });
    return () => {
      active = false;
    };
  }, [gateway, intent]);

  /**
   * Derived rather than a flag. `start()` nulls the quote when a new intent
   * begins, so "there is an intent but no answer yet" is exactly the in-flight
   * state — and storing it separately meant a setState in the effect body.
   */
  const isQuoting = intent !== null && quote === null && quoteError === null;

  const copy = intent ? COPY[intent.kind] : COPY.transfer;
  const stepUp = intent ? requiresStepUp(intent) : false;

  const note = intent ? intentNote(intent) : "";
  const rows = intent
    ? [
        { label: intent.kind === "cash-in" ? "To" : "From", value: intentCardLabel(intent) },
        ...(quote?.rail ? [{ label: "Rail", value: railName(quote.rail) }] : []),
        { label: "Arrival", value: quote?.arrivalLabel ?? "Checking…" },
        { label: "Fee", value: formatMoney(quote?.fee ?? pesos(0)) },
        { label: "Total", value: formatMoney(quote?.total ?? intent.amount) },
        ...(note ? [{ label: "Note", value: note }] : []),
      ]
    : [];

  return {
    title: copy.reviewTitle,
    lead: copy.reviewLead,
    actionLabel: stepUp ? "Continue to confirm" : copy.action,
    submittingLabel: copy.submitting,
    isReady: intent !== null,
    amountLabel: intent ? formatMoney(intent.amount) : "",
    counterparty: intent ? intentCounterparty(intent) : "",
    counterpartyDetail: intent ? intentCounterpartyDetail(intent) : "",
    rows,
    cutoffLabel: quote?.cutoffLabel ?? null,
    limitLabel: quote?.limitLabel ?? null,
    /** Blocked while quoting, because the fee is part of what is being agreed to. */
    canSubmit: intent !== null && quote !== null && !isQuoting && !isSubmitting,
    isQuoting,
    isSubmitting,
    error: error ?? quoteError,
    confirm: async () => {
      if (!intent) return;
      setError(null);
      if (stepUp) {
        navigation.navigate("payment-confirm");
        return;
      }
      await submit(NO_CONFIRMATION_REQUIRED);
    },
    back: navigation.goBack,
  };
}

export function usePaymentConfirmViewModel() {
  const gateway = useBankingGateway();
  const { submit, isSubmitting, error, setError, intent } = usePaymentSubmit();
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const navigation = useNavigation();

  const confirm = async () => {
    if (pin.length !== TRANSACTION_PIN_LENGTH || isVerifying || isSubmitting) return;
    setIsVerifying(true);
    setError(null);

    const verified = await gateway.security.verifyPin(pin);
    setIsVerifying(false);
    if (!verified.ok) {
      setError(verified.error.message);
      setPin("");
      return;
    }

    paymentActions.setConfirmation(verified.value);
    await submit(verified.value);
  };

  return {
    title: "Confirm this payment",
    intro: intent
      ? `Enter your ${TRANSACTION_PIN_LENGTH}-digit transaction PIN to send ${formatMoney(intent.amount)} to ${intentCounterparty(intent)}.`
      : "There is no payment waiting to be confirmed.",
    isReady: intent !== null,
    pin,
    pinLength: TRANSACTION_PIN_LENGTH,
    /** Only digits, capped — the field is a PIN, not free text. */
    setPin: (value: string) => setPin(value.replace(/\D/g, "").slice(0, TRANSACTION_PIN_LENGTH)),
    canSubmit: pin.length === TRANSACTION_PIN_LENGTH && !isVerifying && !isSubmitting,
    isBusy: isVerifying || isSubmitting,
    busyLabel: isVerifying ? "Checking your PIN…" : "Sending securely…",
    error,
    confirm,
    back: navigation.goBack,
  };
}

export function usePaymentReceiptViewModel() {
  const navigation = useNavigation();
  const receipt = usePaymentStore((state) => state.receipt);

  const copy = receipt ? COPY[receiptKind(receipt)] : COPY.transfer;
  const settling = receipt ? isSettling(receipt.status) : false;

  return {
    title: receipt ? (settling ? copy.pendingTitle : copy.receiptTitle) : "No receipt yet",
    isReady: receipt !== null,
    settling,
    amountLabel: receipt
      ? formatMoney({ amount: Math.abs(receipt.amount.amount), currency: receipt.amount.currency })
      : "",
    counterparty: receipt?.name ?? "",
    counterpartyDetail: receipt?.recipient?.handle ?? "",
    rows: receipt
      ? [
          { label: "From", value: receipt.sourceLabel },
          ...(receipt.rail ? [{ label: "Rail", value: railName(receipt.rail) }] : []),
          { label: "Arrival", value: receipt.arrivalLabel },
          { label: "Fee", value: formatMoney(receipt.fee) },
          { label: "Reference", value: receipt.reference },
          { label: "Note", value: receipt.description },
        ]
      : [],
    /**
     * Still simulated, and will stay that way: handing a receipt to another app
     * needs a Share port, and this codebase has no web global to reach for.
     */
    share: () => uiActions.showSimulated("Share receipt"),
    trackStatus: () => navigation.navigate("payment-status"),
    viewActivity: () => {
      if (!receipt) return;
      activityActions.selectTransaction(receipt.id);
      navigation.navigate("transaction-detail");
    },
    done: () => {
      paymentActions.reset();
      transferActions.reset();
      navigation.resetTo("home");
    },
  };
}

export function usePaymentStatusViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const receipt = usePaymentStore((state) => state.receipt);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settling = receipt ? isSettling(receipt.status) : false;

  const check = useCallback(async () => {
    if (!receipt) return;
    setIsChecking(true);
    setError(null);
    const result = await gateway.payments.status(receipt.id);
    if (result.ok) paymentActions.updateReceipt({ ...receipt, ...result.value });
    else setError(result.error.message);
    setIsChecking(false);
  }, [gateway, receipt]);

  const status = receipt?.status ?? "pending";

  return {
    title: "Transfer status",
    isReady: receipt !== null,
    reference: receipt?.reference ?? "",
    amountLabel: receipt
      ? formatMoney({ amount: Math.abs(receipt.amount.amount), currency: receipt.amount.currency })
      : "",
    counterparty: receipt?.name ?? "",
    railLabel: receipt?.rail ? railName(receipt.rail) : "",
    /** The timeline the batch rail actually goes through. */
    steps: [
      { id: "submitted", label: "Submitted to NetBank", done: true },
      { id: "accepted", label: "Accepted by the rail", done: true },
      {
        id: "settled",
        label:
          status === "returned"
            ? "Returned by the beneficiary bank"
            : status === "completed"
              ? "Credited to the beneficiary"
              : "Waiting for the next batch",
        done: status === "completed" || status === "returned",
      },
    ],
    statusLabel:
      status === "completed"
        ? "Completed"
        : status === "returned"
          ? "Returned"
          : status === "failed"
            ? "Failed"
            : "Pending",
    settling,
    detail:
      status === "returned"
        ? (receipt?.description ?? "")
        : settling
          ? "PESONet moves in batches, so this clears within the same banking day."
          : "This transfer has finished settling.",
    isChecking,
    error,
    check,
    back: navigation.goBack,
    viewActivity: () => {
      if (!receipt) return;
      activityActions.selectTransaction(receipt.id);
      navigation.navigate("transaction-detail");
    },
  };
}

const receiptKind = (receipt: PaymentReceipt): keyof typeof COPY => {
  switch (receipt.kind) {
    case "cash-in":
      return "cash-in";
    case "bill-payment":
      return "bill";
    case "qr-payment":
      return "qr";
    default:
      return "transfer";
  }
};
