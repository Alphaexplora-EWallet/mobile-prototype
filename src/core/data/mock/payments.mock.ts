import type { Biller, DepositMethod, Recipient } from "../../domain/payments";
import type { ScheduledPayment, Transaction } from "../../domain/transaction";

export const MOCK_TRANSACTIONS: readonly Transaction[] = [
  { id: "daily-brew", glyph: "☕", name: "Daily Brew", when: "Today, 8:23 AM", amount: "−₱160.00", positive: false },
  { id: "freshmart", glyph: "◈", name: "FreshMart", when: "Yesterday, 6:42 PM", amount: "−₱845.75", positive: false },
  {
    id: "money-received",
    glyph: "↙",
    name: "Money received",
    when: "Yesterday, 11:18 AM",
    amount: "+₱2,000.00",
    positive: true,
  },
];

export const MOCK_SCHEDULED_PAYMENTS: readonly ScheduledPayment[] = [
  { id: "meralco", glyph: "⚡", name: "Meralco", when: "Autopay · Aug 18", amount: "₱2,340.00" },
  { id: "converge", glyph: "◎", name: "Converge", when: "Autopay · Aug 22", amount: "₱1,699.00" },
];

export const MOCK_AMOUNT_PRESETS: readonly string[] = ["500", "1,000", "2,500"];

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
