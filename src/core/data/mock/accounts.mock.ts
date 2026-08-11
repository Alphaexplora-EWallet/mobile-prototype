import type { BankAccount, QrInstruction, VirtualAccount } from "../../domain/account";
import { MOCK_CARDS } from "./cards.mock";
import { pesos } from "../../money/money";

const NETBANK_NAME = "NetBank (A Rural Bank), Inc.";

/**
 * The deposit accounts behind the two card faces. The card is the thing the user
 * recognises; the account number is the thing a rail can credit, and until now
 * the app had no representation of it at all.
 */
export const MOCK_ACCOUNTS: readonly BankAccount[] = [
  {
    id: "acct-main",
    cardId: "main",
    accountName: "MAYA SANTOS",
    accountNumber: "009123456789",
    bankName: NETBANK_NAME,
    status: "active",
    openedLabel: "Jan 2025",
    balance: MOCK_CARDS[0].balance,
  },
  {
    id: "acct-travel",
    cardId: "travel",
    accountName: "MAYA SANTOS",
    accountNumber: "009987651198",
    bankName: NETBANK_NAME,
    status: "active",
    openedLabel: "Jan 2025",
    balance: MOCK_CARDS[1].balance,
  },
];

/**
 * The inbound rail. Any other Philippine bank can push to this number over
 * InstaPay or PESONet, which is the canonical BaaS cash-in and the only way
 * money enters the wallet from outside.
 */
export const MOCK_VIRTUAL_ACCOUNT: VirtualAccount = {
  accountNumber: "009123456789",
  bankName: NETBANK_NAME,
  accountName: "MAYA SANTOS",
  rails: ["instapay", "pesonet"],
  instructions: [
    "Open the app of the bank holding your money.",
    "Choose Transfer, then InstaPay for an instant credit or PESONet for same-day.",
    `Send to ${NETBANK_NAME} using the account number above.`,
    "Your FIN-A balance updates as soon as the rail settles.",
  ],
};

/**
 * Seeded QR PH codes the scanner can resolve. The camera sits behind a port this
 * prototype does not implement, so `qr-scan` offers these instead of a viewfinder
 * that cannot work — one fixed-amount merchant code and one open code.
 */
export const MOCK_QR_INSTRUCTIONS: readonly QrInstruction[] = [
  {
    payload: "00020101021228540011ph.ppmi.qrph0114DAILYBREW00015204581253036085802PH5909DailyBrew6006Manila",
    merchantName: "Daily Brew",
    merchantCity: "Manila",
    amount: pesos(185),
    reference: "DB-2026-0814",
  },
  {
    payload: "00020101021128540011ph.ppmi.qrph0114SARISARIMARIA5204541152036085802PH5912Sari Maria6011Quezon City",
    merchantName: "Sari Maria",
    merchantCity: "Quezon City",
    amount: null,
    reference: "SM-OPEN",
  },
];
