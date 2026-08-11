import { requestAmountErrorMessage, validateRequestAmount } from "../domain/request";
import { SIMULATED_NOTE } from "../domain/simulation";
import { parseMoneyInput } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { useRecipientsStore } from "../stores/recipients.store";
import { requestsActions, useRequestsStore } from "../stores/requests.store";
import { createAmountDraft } from "./useMoneyMovementViewModel";

/**
 * Request money (GAP-03): pick a saved recipient, an amount and an optional
 * note, then file a *pending* request. Nothing moves yet — the money only
 * changes hands when the recipient accepts and the payment runs through the
 * shared pipeline, which is what the Activity screen's accept action starts.
 *
 * The payer is never typed: the saved-recipient list is the only source, which
 * is the whole "request-eligibility" story for this prototype.
 */
export function useRequestMoneyViewModel() {
  const navigation = useNavigation();
  const recipients = useRecipientsStore((state) => state.saved);
  const recipientId = useRequestsStore((state) => state.recipientId);
  const amountInput = useRequestsStore((state) => state.amount);
  const note = useRequestsStore((state) => state.note);

  // First saved recipient is the default, mirroring the transfer screen.
  const effectiveRecipientId = recipientId ?? recipients[0]?.id ?? "";
  const payer = recipients.find((candidate) => candidate.id === effectiveRecipientId) ?? null;

  const amount = parseMoneyInput(amountInput);
  // Validated live: a non-empty amount that does not parse, or is not positive,
  // is a mistake the user should see before pressing send.
  const issue = amountInput.trim() === "" ? null : validateRequestAmount(amount);
  const error = issue ? requestAmountErrorMessage(issue) : null;

  return {
    title: "Request money",
    simulatedNote: SIMULATED_NOTE,
    recipients,
    selectedRecipient: payer?.id ?? "",
    selectRecipient: (id: string) => requestsActions.startRequest(id),
    ...createAmountDraft(amountInput, requestsActions.setAmount),
    note,
    setNote: requestsActions.setNote,
    canSend: Boolean(payer && amount && amount.amount > 0),
    error,
    manageRecipients: () => navigation.navigate("recipients"),
    send: () => {
      if (!payer || !amount || amount.amount <= 0) return;
      requestsActions.createRequest(payer, amount, note);
      navigation.navigate("activity");
    },
    back: navigation.goBack,
  };
}
