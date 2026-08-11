import { MOCK_LOAD_OPERATORS, MOCK_LOAD_PRESETS } from "../data/mock/payments.mock";
import { mobileNumberErrorMessage, normalizePhoneDigits, validateMobileNumber } from "../domain/load";
import { parseMoneyInput } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { buyloadActions, useBuyloadStore } from "../stores/buyload.store";
import { paymentActions } from "../stores/payment.store";
import { useSelectedCard } from "./useCardViews";
import { createAmountDraft } from "./useMoneyMovementViewModel";

/**
 * Buying prepaid load: pick an operator (from the Pay tab), type the mobile
 * number, choose a load amount, then hand off to the shared
 * review → confirm → receipt pipeline as a `buyload` intent.
 *
 * Unlike bills there is no biller round-trip: the operator→prefix rules are a
 * pure domain function, so the number is validated locally and the masked form
 * is what the review hero and receipt ever render.
 */
export function useLoadEntryViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const source = useSelectedCard();

  const operatorId = useBuyloadStore((state) => state.operatorId);
  const phoneNumber = useBuyloadStore((state) => state.phoneNumber);
  const amountInput = useBuyloadStore((state) => state.amount);

  const operator = MOCK_LOAD_OPERATORS.find((candidate) => candidate.id === operatorId) ?? null;
  const amount = parseMoneyInput(amountInput);

  // Validated live: the rules are local and instant, so there is no reason to
  // make the user press a button before seeing that the number is wrong.
  const issue = !operator || phoneNumber.trim() === "" ? null : validateMobileNumber(phoneNumber, operator);
  const error = issue && operator ? mobileNumberErrorMessage(issue, operator) : null;

  return {
    title: "Buy load",
    isReady: operator !== null,
    operatorName: operator?.name ?? "",
    operatorDetail: operator?.detail ?? "",
    operatorIcon: operator?.icon ?? "phone",
    phoneNumber,
    setPhoneNumber: (value: string) => buyloadActions.setPhoneNumber(value.replace(/[^\d\s-]/g, "").slice(0, 16)),
    error,
    ...createAmountDraft(amountInput, buyloadActions.setAmount, MOCK_LOAD_PRESETS),
    availableLabel: source.balanceLabel,
    canContinue: Boolean(operator && phoneNumber.trim() !== "" && issue === null && amount && amount.amount > 0),
    review: () => {
      if (!operator || phoneNumber.trim() === "" || !amount || amount.amount <= 0 || issue) return;
      paymentActions.start(
        {
          kind: "buyload",
          sourceCardId: source.id,
          sourceLabel: `${source.displayLabel} •••• ${source.last4}`,
          operator,
          phoneNumber: normalizePhoneDigits(phoneNumber),
          amount,
        },
        gateway.nextIdempotencyKey(),
      );
      navigation.navigate("payment-review");
    },
    back: navigation.goBack,
  };
}
