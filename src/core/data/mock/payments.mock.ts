import type { Biller, DepositMethod, Recipient } from "../../domain/payments";
import type { ScheduledPayment, Transaction } from "../../domain/transaction";
import { type Money, pesos } from "../../money/money";

export const MOCK_TRANSACTIONS: readonly Transaction[] = [
  { id: "daily-brew", glyph: "☕", name: "Daily Brew", when: "Today, 8:23 AM", amount: pesos(-160) },
  { id: "freshmart", glyph: "◈", name: "FreshMart", when: "Yesterday, 6:42 PM", amount: pesos(-845.75) },
  {
    id: "money-received",
    glyph: "↙",
    name: "Money received",
    when: "Yesterday, 11:18 AM",
    amount: pesos(2_000),
  },
];

export const MOCK_SCHEDULED_PAYMENTS: readonly ScheduledPayment[] = [
  { id: "meralco", glyph: "⚡", name: "Meralco", when: "Autopay · Aug 18", amount: pesos(2_340) },
  { id: "converge", glyph: "◎", name: "Converge", when: "Autopay · Aug 22", amount: pesos(1_699) },
];

export const MOCK_AMOUNT_PRESETS: readonly Money[] = [pesos(500), pesos(1_000), pesos(2_500)];

export const MOCK_RECIPIENTS: readonly Recipient[] = [
  { initials: "JD", name: "Jomar D.", handle: "•••• 4471" },
  { initials: "MS", name: "Mira S.", handle: "0917 ••• 2288" },
  { initials: "AR", name: "Ate Rosa", handle: "•••• 9032" },
  { initials: "KL", name: "Kuya Lito", handle: "0998 ••• 1140" },
];

export const MOCK_DEPOSIT_METHODS: readonly DepositMethod[] = [
  { id: "bank", icon: "bank", title: "Linked bank account", detail: "BPI Savings •••• 6612" },
  { id: "card", icon: "card", title: "Debit or credit card", detail: "Visa •••• 4102" },
  { id: "counter", icon: "wallet", title: "Over the counter", detail: "7-Eleven, Palawan, and partners" },
  { id: "qr", icon: "qr", title: "Scan to cash in", detail: "Show a QR at any partner branch" },
];

export const MOCK_BILLERS: readonly Biller[] = [
  { id: "power", icon: "bolt", name: "Meralco", detail: "Electricity", due: "Due Aug 18" },
  { id: "internet", icon: "globe", name: "Converge", detail: "Home internet", due: "Due Aug 22" },
  { id: "rent", icon: "home", name: "Landlord", detail: "Monthly rent", due: "Due Sep 1" },
  { id: "card-bill", icon: "receipt", name: "Card statement", detail: "Credit card", due: "Due Sep 4" },
];
