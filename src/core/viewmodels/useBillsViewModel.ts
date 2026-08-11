import { useState } from "react";
import type { BillIntent } from "../domain/paymentIntent";
import { MOCK_BILLERS } from "../data/mock/payments.mock";
import { formatMoney, parseMoneyInput } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { billsActions, useBillsStore } from "../stores/bills.store";
import { paymentActions } from "../stores/payment.store";
import { useSelectedCard } from "./useCardViews";

/**
 * Paying a bill, which was four rows that opened a simulated sheet.
 *
 * The account is validated with the biller before anything is paid: it returns
 * the name on the account and, when it has one, the amount outstanding — so the
 * common case is confirming a figure rather than typing one.
 */
export function useBillEntryViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const source = useSelectedCard();

  const billerId = useBillsStore((state) => state.billerId);
  const accountNumber = useBillsStore((state) => state.accountNumber);
  const amountInput = useBillsStore((state) => state.amount);
  const accountName = useBillsStore((state) => state.accountName);
  const amountDue = useBillsStore((state) => state.amountDue);

  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const biller = MOCK_BILLERS.find((candidate) => candidate.id === billerId) ?? null;
  const amount = parseMoneyInput(amountInput);

  return {
    title: biller ? `Pay ${biller.name}` : "Pay a bill",
    isReady: biller !== null,
    billerName: biller?.name ?? "",
    billerDetail: biller?.detail ?? "",
    billerDue: biller?.due ?? "",
    billerIcon: biller?.icon ?? "receipt",
    accountNumber,
    setAccountNumber: (value: string) => billsActions.setAccountNumber(value.replace(/[^\d\s-]/g, "")),
    canValidate: accountNumber.trim().length > 0 && !isValidating,
    isValidating,
    validate: async () => {
      if (!biller) return;
      setIsValidating(true);
      setError(null);
      const result = await gateway.directory.validateBillAccount(biller.id, accountNumber);
      if (result.ok) {
        billsActions.setValidation(result.value.accountName, result.value.amountDue ?? null);
        // Prefill what the biller says is owed; the payer can still change it.
        if (result.value.amountDue) billsActions.setAmount(String(result.value.amountDue.amount / 100));
      } else {
        billsActions.setValidation(null, null);
        setError(result.error.message);
      }
      setIsValidating(false);
    },
    accountName,
    amountDueLabel: amountDue ? formatMoney(amountDue) : null,
    amount: amountInput,
    setAmount: billsActions.setAmount,
    availableLabel: source.balanceLabel,
    canContinue: Boolean(biller && accountName && amount && amount.amount > 0),
    error,
    review: () => {
      if (!biller || !accountName || !amount || amount.amount <= 0) return;
      const intent: BillIntent = {
        kind: "bill",
        sourceCardId: source.id,
        sourceLabel: `${source.displayLabel} •••• ${source.last4}`,
        biller,
        accountNumber: accountNumber.replace(/\s/g, ""),
        accountName,
        amount,
      };
      paymentActions.start(intent, gateway.nextIdempotencyKey());
      navigation.navigate("payment-review");
    },
    back: navigation.goBack,
  };
}

export function useAutopayDetailViewModel() {
  const navigation = useNavigation();
  const selectedId = useBillsStore((state) => state.selectedEnrollment);
  const enrollments = useBillsStore((state) => state.enrollments);

  const enrollment = enrollments.find((entry) => entry.id === selectedId) ?? null;
  const paused = enrollment?.status === "paused";

  return {
    title: enrollment?.name ?? "Autopay",
    isReady: enrollment !== null,
    glyph: enrollment?.glyph ?? "",
    amountLabel: enrollment ? formatMoney(enrollment.amount) : "",
    statusLabel: paused ? "Paused" : "Active",
    paused,
    rows: enrollment
      ? [
          { label: "Next run", value: paused ? "Paused — will not run" : enrollment.when.replace("Autopay · ", "") },
          { label: "Account", value: enrollment.accountNumber },
          { label: "Paid from", value: enrollment.sourceLabel },
          { label: "Amount", value: formatMoney(enrollment.amount) },
        ]
      : [],
    togglePause: () => {
      if (!enrollment) return;
      billsActions.setEnrollmentStatus(enrollment.id, paused ? "active" : "paused");
    },
    cancel: () => {
      if (!enrollment) return;
      billsActions.cancelEnrollment(enrollment.id);
      navigation.goBack();
    },
    back: navigation.goBack,
  };
}
