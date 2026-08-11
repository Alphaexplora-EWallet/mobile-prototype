import { useCallback, useEffect, useMemo, useState } from "react";
import type { TransferIntent } from "../domain/paymentIntent";
import type { Bank, TransferRail } from "../domain/rails";
import { defaultRailFor, RAIL_INFO } from "../domain/rails";
import { initialsOf, maskAccountNumber, type Recipient } from "../domain/payments";
import { parseMoneyInput } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { paymentActions } from "../stores/payment.store";
import { recipientsActions, useRecipientsStore } from "../stores/recipients.store";
import { transferActions, useTransferStore } from "../stores/transfer.store";
import { useSelectedCard } from "./useCardViews";

/**
 * The step that had no screen: choosing a bank, typing an account number, and
 * confirming the name that comes back before any money moves.
 *
 * Account name inquiry is the only protection a sender has against a typo — the
 * rail credits whoever owns the number, and there is no recall.
 */
export function useTransferDestinationViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const source = useSelectedCard();

  const amountInput = useTransferStore((state) => state.amount);
  const note = useTransferStore((state) => state.note);
  const bankCode = useTransferStore((state) => state.destinationBankCode);
  const accountNumber = useTransferStore((state) => state.destinationAccountNumber);
  const verifiedName = useTransferStore((state) => state.destinationName);
  const rail = useTransferStore((state) => state.destinationRail);
  const saveRecipient = useTransferStore((state) => state.saveDestination);

  const [banks, setBanks] = useState<readonly Bank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void gateway.directory.banks().then((result) => {
      if (!active) return;
      if (result.ok) setBanks(result.value.filter((bank) => !bank.rails.includes("internal")));
      else setError(result.error.message);
      setIsLoadingBanks(false);
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  const amount = useMemo(() => parseMoneyInput(amountInput), [amountInput]);
  const bank = banks.find((candidate) => candidate.code === bankCode) ?? null;

  const verify = useCallback(async () => {
    if (!bank || accountNumber.trim().length === 0) return;
    setIsVerifying(true);
    setError(null);
    const result = await gateway.directory.verifyAccountName(bank.code, accountNumber);
    if (result.ok) transferActions.setDestinationName(result.value.accountName);
    else {
      transferActions.setDestinationName(null);
      setError(result.error.message);
    }
    setIsVerifying(false);
  }, [bank, accountNumber, gateway]);

  /** Only the rails this bank can actually be reached on. */
  const railOptions = (bank?.rails ?? [])
    .filter((candidate) => candidate !== "internal")
    .map((candidate) => ({
      id: candidate,
      label: RAIL_INFO[candidate].name,
      detail: RAIL_INFO[candidate].detail,
    }));

  const canContinue = Boolean(bank && verifiedName && rail && amount && amount.amount > 0);

  return {
    title: "Send to a bank",
    intro: "We check the account name with the bank before anything leaves your wallet.",
    amount: amountInput,
    setAmount: transferActions.setAmount,
    availableLabel: source.balanceLabel,
    banks: banks.map((candidate) => ({
      id: candidate.code,
      title: candidate.shortName,
      detail: candidate.name,
      selected: candidate.code === bankCode,
    })),
    isLoadingBanks,
    selectBank: (code: string) => {
      const chosen = banks.find((candidate) => candidate.code === code) ?? null;
      transferActions.setDestinationBank(code, chosen ? defaultRailFor(chosen) : null);
    },
    accountNumber,
    setAccountNumber: (value: string) => transferActions.setDestinationAccountNumber(value.replace(/[^\d\s]/g, "")),
    canVerify: Boolean(bank) && accountNumber.trim().length > 0 && !isVerifying,
    isVerifying,
    verify,
    verifiedName,
    /** Shown once the inquiry answers, so the sender can catch a wrong number. */
    confirmationPrompt: verifiedName ? `Sending to ${verifiedName}. Is that right?` : null,
    railOptions,
    selectedRail: rail,
    selectRail: (value: string) => transferActions.setDestinationRail(value as TransferRail),
    saveRecipient,
    toggleSaveRecipient: transferActions.setSaveDestination,
    noteValue: note,
    setNote: transferActions.setNote,
    canContinue,
    error,
    review: () => {
      if (!bank || !verifiedName || !rail || !amount) return;
      const digits = accountNumber.replace(/\s/g, "");
      const recipient: Recipient = {
        id: `${bank.code}-${digits}`,
        initials: initialsOf(verifiedName),
        name: verifiedName,
        handle: maskAccountNumber(digits),
        accountNumber: digits,
        bankCode: bank.code,
      };
      if (saveRecipient) recipientsActions.add(recipient);

      const intent: TransferIntent = {
        kind: "transfer",
        sourceCardId: source.id,
        sourceLabel: `${source.displayLabel} •••• ${source.last4}`,
        recipient,
        rail,
        amount,
        note,
      };
      paymentActions.start(intent, gateway.nextIdempotencyKey());
      navigation.navigate("payment-review");
    },
    back: navigation.goBack,
  };
}

export function useRecipientsViewModel() {
  const navigation = useNavigation();
  const saved = useRecipientsStore((state) => state.saved);
  const selectedRecipient = useTransferStore((state) => state.selectedRecipient);

  return {
    title: "Send to",
    intro: "Saved FIN-A wallets, a Philippine mobile number, or any bank account.",
    items: saved.map((recipient) => ({
      id: recipient.id,
      initials: recipient.initials,
      name: recipient.name,
      handle: recipient.handle,
      selected: recipient.id === selectedRecipient,
    })),
    /** Choosing a saved contact returns to the amount screen with it selected. */
    select: (id: string) => {
      transferActions.selectRecipient(id);
      navigation.goBack();
    },
    remove: recipientsActions.remove,
    addBankAccount: () => {
      transferActions.resetDestination();
      navigation.navigate("transfer-destination");
    },
    /** Send to any FIN-A wallet keyed by phone — the same draft, a different address. */
    addMobile: () => {
      transferActions.resetMobileDestination();
      navigation.navigate("send-mobile");
    },
    back: navigation.goBack,
  };
}
