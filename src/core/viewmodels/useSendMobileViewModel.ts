import { useCallback, useMemo, useState } from "react";
import type { TransferIntent } from "../domain/paymentIntent";
import { FINA_BANK_CODE } from "../domain/rails";
import { isValidMobileNumber, maskMobileNumber, normalizeMobileNumber } from "../domain/mobile";
import { initialsOf, type Recipient } from "../domain/payments";
import { parseMoneyInput } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { paymentActions } from "../stores/payment.store";
import { transferActions, useTransferStore } from "../stores/transfer.store";
import { useSelectedCard } from "./useCardViews";

/**
 * Send to a mobile number — the FIN-A answer to the bank account name check.
 *
 * The number is looked up on the simulated directory (same protection as
 * `useTransferDestinationViewModel`: the sender sees whose wallet they are
 * paying before any money moves), and the confirmed send runs through the
 * shared payment pipeline as an internal-rail transfer, so it never steps up.
 */
export function useSendMobileViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const source = useSelectedCard();

  const amountInput = useTransferStore((state) => state.amount);
  const note = useTransferStore((state) => state.note);
  const mobileNumber = useTransferStore((state) => state.mobileNumber);
  const verifiedName = useTransferStore((state) => state.mobileName);

  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = useMemo(() => parseMoneyInput(amountInput), [amountInput]);

  const verify = useCallback(async () => {
    const digits = normalizeMobileNumber(mobileNumber);
    if (!isValidMobileNumber(digits) || isVerifying) return;
    setIsVerifying(true);
    setError(null);
    const result = await gateway.directory.lookupMobileName(digits);
    // The number may have been edited while the inquiry was in flight — only
    // apply the answer if it still matches what is on screen.
    if (useTransferStore.getState().mobileNumber === digits) {
      if (result.ok) transferActions.setMobileName(result.value.accountName);
      else {
        transferActions.setMobileName(null);
        setError(result.error.message);
      }
    }
    setIsVerifying(false);
  }, [mobileNumber, isVerifying, gateway]);

  const canContinue = Boolean(verifiedName && amount && amount.amount > 0);

  return {
    title: "Send to a mobile number",
    intro: "We check whose wallet that number belongs to before anything leaves yours.",
    amount: amountInput,
    setAmount: transferActions.setAmount,
    availableLabel: source.balanceLabel,
    mobileNumber,
    /** Digits only, capped at 11 — the field is a number, not free text. */
    setMobileNumber: (value: string) => transferActions.setMobileNumber(normalizeMobileNumber(value).slice(0, 11)),
    canVerify: isValidMobileNumber(mobileNumber) && !isVerifying,
    isVerifying,
    verify,
    verifiedName,
    /** Shown once the inquiry answers, so the sender can catch a wrong number. */
    confirmationPrompt: verifiedName ? `Sending to ${verifiedName}. Is that right?` : null,
    noteValue: note,
    setNote: transferActions.setNote,
    canContinue,
    error,
    review: () => {
      if (!verifiedName || !amount || amount.amount <= 0) return;
      const digits = normalizeMobileNumber(mobileNumber);
      const recipient: Recipient = {
        id: `mobile-${digits}`,
        initials: initialsOf(verifiedName),
        name: verifiedName,
        handle: maskMobileNumber(digits),
        accountNumber: digits,
        bankCode: FINA_BANK_CODE,
      };

      const intent: TransferIntent = {
        kind: "transfer",
        sourceCardId: source.id,
        sourceLabel: `${source.displayLabel} •••• ${source.last4}`,
        recipient,
        rail: "internal",
        amount,
        note,
      };
      paymentActions.start(intent, gateway.nextIdempotencyKey());
      navigation.navigate("payment-review");
    },
    back: navigation.goBack,
  };
}
