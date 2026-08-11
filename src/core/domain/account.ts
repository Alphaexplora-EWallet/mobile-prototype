import type { CardId } from "./card";
import type { TransferRail } from "./rails";
import type { Money } from "../money/money";

export type AccountStatus = "active" | "restricted" | "closed";

export type BankAccount = {
  id: string;
  /** Which card face fronts this account. */
  cardId: CardId;
  accountName: string;
  accountNumber: string;
  bankName: string;
  status: AccountStatus;
  openedLabel: string;
  balance: Money;
};

/**
 * The inbound side of a BaaS account: a real, addressable account number that
 * other banks can push to over InstaPay or PESONet. This is the only way money
 * enters the wallet from outside, and the app had no screen for it.
 */
export type VirtualAccount = {
  accountNumber: string;
  bankName: string;
  accountName: string;
  rails: readonly TransferRail[];
  /** Ordered steps shown on the funding screen. */
  instructions: readonly string[];
};

/**
 * A QR PH code this wallet hands out to be paid. `payload` is the EMVCo-style
 * string; the app renders it as a matrix but never parses its own output.
 */
export type QrPayload = {
  payload: string;
  merchantName: string;
  /** Null for an open code, where the payer types the amount. */
  amount: Money | null;
  note: string;
  expiresLabel: string;
};

/** A decoded QR PH code this wallet is about to pay. */
export type QrInstruction = {
  payload: string;
  merchantName: string;
  merchantCity: string;
  /** Fixed-amount codes lock the amount; open codes let the payer choose. */
  amount: Money | null;
  reference: string;
};

export type InboundQrRequest = {
  cardId: CardId;
  /** Null produces an open code. */
  amount: Money | null;
  note: string;
};
