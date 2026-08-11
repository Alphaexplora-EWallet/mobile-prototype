import type { AutopayEnrollment, Biller, DepositMethod, Recipient } from "../../domain/payments";
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

/**
 * The same two schedules with what a detail screen needs. Kept alongside
 * `MOCK_SCHEDULED_PAYMENTS` rather than replacing it: the Home and Pay rows
 * render from the narrower shape, and widening it would change what they show.
 */
export const MOCK_AUTOPAY: readonly AutopayEnrollment[] = [
  {
    id: "meralco",
    billerId: "power",
    glyph: "⚡",
    name: "Meralco",
    when: "Autopay · Aug 18",
    amount: pesos(2_340),
    accountNumber: "0412887301",
    status: "active",
    sourceLabel: "Main wallet •••• 8421",
  },
  {
    id: "converge",
    billerId: "internet",
    glyph: "◎",
    name: "Converge",
    when: "Autopay · Aug 22",
    amount: pesos(1_699),
    accountNumber: "8830012245",
    status: "active",
    sourceLabel: "Main wallet •••• 8421",
  },
];

export const MOCK_AMOUNT_PRESETS: readonly Money[] = [pesos(500), pesos(1_000), pesos(2_500)];

/**
 * `handle` is stored rather than derived from `accountNumber`: bank accounts
 * mask to "•••• 4471" but mobile-keyed wallets show their prefix, and the chips
 * render nothing else. `id` is the store key — `initials` was, and is not unique.
 *
 * All four are FIN-A wallets, which is what the app already claimed: every
 * transfer promised "Arrives instantly to FIN-A wallets". Sending to another
 * bank is a destination the user picks, not a saved contact, so it arrives with
 * the destination screen rather than by quietly re-pointing these fixtures.
 */
export const MOCK_RECIPIENTS: readonly Recipient[] = [
  {
    id: "jomar-d",
    initials: "JD",
    name: "Jomar D.",
    handle: "•••• 4471",
    accountNumber: "9017234471",
    bankCode: "FINA",
  },
  {
    id: "mira-s",
    initials: "MS",
    name: "Mira S.",
    handle: "0917 ••• 2288",
    accountNumber: "09174562288",
    bankCode: "FINA",
  },
  {
    id: "ate-rosa",
    initials: "AR",
    name: "Ate Rosa",
    handle: "•••• 9032",
    accountNumber: "003812349032",
    bankCode: "FINA",
  },
  {
    id: "kuya-lito",
    initials: "KL",
    name: "Kuya Lito",
    handle: "0998 ••• 1140",
    accountNumber: "09986541140",
    bankCode: "FINA",
  },
];

/**
 * `bank` is first, so it is the default selection — and it is `inbound`, which
 * is why the deposit screen's fee strip still reads "No fee / Arrives in seconds
 * once confirmed" exactly as it always did.
 */
export const MOCK_DEPOSIT_METHODS: readonly DepositMethod[] = [
  {
    id: "bank",
    icon: "bank",
    title: "Linked bank account",
    detail: "BPI Savings •••• 6612",
    fee: pesos(0),
    arrivalLabel: "Arrives in seconds once confirmed",
    inbound: true,
  },
  {
    id: "card",
    icon: "card",
    title: "Debit or credit card",
    detail: "Visa •••• 4102",
    fee: pesos(25),
    arrivalLabel: "Credited instantly",
  },
  {
    id: "counter",
    icon: "wallet",
    title: "Over the counter",
    detail: "7-Eleven, Palawan, and partners",
    fee: pesos(20),
    arrivalLabel: "Credited within an hour of payment",
  },
  {
    id: "qr",
    icon: "qr",
    title: "Scan to cash in",
    detail: "Show a QR at any partner branch",
    fee: pesos(0),
    arrivalLabel: "Credited instantly",
  },
];

export const MOCK_BILLERS: readonly Biller[] = [
  { id: "power", icon: "bolt", name: "Meralco", detail: "Electricity", due: "Due Aug 18", category: "electric" },
  { id: "internet", icon: "globe", name: "Converge", detail: "Home internet", due: "Due Aug 22", category: "telecom" },
  { id: "globe", icon: "phone", name: "Globe", detail: "Postpaid mobile", due: "Due Aug 25", category: "telecom" },
  { id: "smart", icon: "phone", name: "Smart", detail: "Mobile & broadband", due: "Due Aug 30", category: "telecom" },
  { id: "maynilad", icon: "droplet", name: "Maynilad", detail: "Water utility", due: "Due Aug 21", category: "water" },
  {
    id: "manila-water",
    icon: "droplet",
    name: "Manila Water",
    detail: "Water utility",
    due: "Due Aug 24",
    category: "water",
  },
  { id: "sss", icon: "landmark", name: "SSS", detail: "Social security", due: "Due Aug 15", category: "government" },
  {
    id: "pagibig",
    icon: "landmark",
    name: "Pag-IBIG",
    detail: "Housing fund",
    due: "Due Sep 5",
    category: "government",
  },
  { id: "rent", icon: "home", name: "Landlord", detail: "Monthly rent", due: "Due Sep 1", category: "other" },
  {
    id: "card-bill",
    icon: "receipt",
    name: "Card statement",
    detail: "Credit card",
    due: "Due Sep 4",
    category: "other",
  },
];
