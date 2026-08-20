import { useState } from "react";
import type { BillIntent } from "../domain/paymentIntent";
import { BILLER_CATEGORY_LABELS, BILLER_CATEGORY_ORDER, searchBillers } from "../domain/payments";
import { MOCK_BILLERS } from "../data/mock/payments.mock";
import { formatMoney, parseMoneyInput } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { billsActions, useBillsStore } from "../stores/bills.store";
import { billerCatalogActions, useBillerCatalogStore } from "../stores/billerCatalog.store";
import { paymentActions } from "../stores/payment.store";
import { useSelectedCard } from "./useCardViews";
import type { BillerGroup, BillerRowVM, CategoryPillVM } from "./useMoneyMovementViewModel";

const CATEGORY_PILL_CONFIG: readonly CategoryPillVM[] = [
  { id: "all", label: "All", icon: "globe" },
  { id: "electric", label: "Electric", icon: "bolt" },
  { id: "telecom", label: "Telco & WiFi", icon: "phone" },
  { id: "water", label: "Water Supply", icon: "droplet" },
  { id: "government", label: "Gov Agencies", icon: "landmark" },
  { id: "other", label: "Other Bills", icon: "receipt" },
];

/**
 * Paying a bill: choose a biller from the catalog, enter account details, validate,
 * then review and pay.
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
  const enrollments = useBillsStore((state) => state.enrollments);

  const searchQuery = useBillerCatalogStore((state) => state.searchQuery);
  const selectedCategory = useBillerCatalogStore((state) => state.selectedCategory);
  const favoriteBillerIds = useBillerCatalogStore((state) => state.favoriteBillerIds);

  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const biller = MOCK_BILLERS.find((candidate) => candidate.id === billerId) ?? null;
  const amount = parseMoneyInput(amountInput);

  const matched = searchBillers(MOCK_BILLERS, searchQuery);
  const enrichedBillers: readonly BillerRowVM[] = matched.map((b) => ({
    ...b,
    favorited: favoriteBillerIds.includes(b.id),
    autopayStatus: enrollments.find((e) => e.billerId === b.id)?.status,
  }));
  const allEnriched: readonly BillerRowVM[] = MOCK_BILLERS.map((b) => ({
    ...b,
    favorited: favoriteBillerIds.includes(b.id),
    autopayStatus: enrollments.find((e) => e.billerId === b.id)?.status,
  }));
  const favorites = allEnriched.filter((b) => b.favorited);

  const visibleCategories =
    selectedCategory === "all"
      ? BILLER_CATEGORY_ORDER
      : BILLER_CATEGORY_ORDER.filter((cat) => cat === selectedCategory);

  const catalog: readonly BillerGroup[] = visibleCategories.flatMap((category) => {
    const categoryBillers = enrichedBillers.filter((b) => b.category === category);
    return categoryBillers.length === 0
      ? []
      : [{ category, label: BILLER_CATEGORY_LABELS[category], billers: categoryBillers }];
  });

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
    catalog,
    favorites,
    showFavorites: favorites.length > 0 && searchQuery.trim() === "",
    emptySearch: searchQuery.trim() !== "" && matched.length === 0,
    searchQuery,
    setSearchQuery: billerCatalogActions.setSearchQuery,
    selectedCategory,
    setSelectedCategory: billerCatalogActions.setSelectedCategory,
    categoryPills: CATEGORY_PILL_CONFIG,
    scheduledLabels: enrollments.map((payment) => ({
      id: payment.id,
      glyph: payment.glyph,
      name: payment.name,
      when: payment.status === "paused" ? payment.when.replace("Autopay", "Paused") : payment.when,
      amountLabel: formatMoney(payment.amount),
      status: payment.status,
    })),
    openAutopay: (id: string) => {
      billsActions.selectEnrollment(id);
      navigation.navigate("autopay-detail");
    },
    selectBiller: (id: string) => billsActions.startBill(id),
    toggleFavorite: billerCatalogActions.toggleFavorite,
    clearBiller: () => billsActions.startBill(""),
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
    back: () => {
      if (biller) billsActions.startBill("");
      else navigation.goBack();
    },
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
