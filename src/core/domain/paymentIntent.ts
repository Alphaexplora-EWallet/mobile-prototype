import type { QrInstruction } from "./account";
import type { TransactionKind } from "./banking";
import type { CardId } from "./card";
import type { Biller, DepositMethod, Recipient } from "./payments";
import type { TransferRail } from "./rails";
import { compareMoney, type Money, pesos } from "../money/money";

/**
 * What the user is trying to do, before a rail has quoted it. One union rather
 * than four request types means one review screen, one confirm screen and one
 * receipt screen serve transfers, cash-in, bills and QR — the alternative was
 * eight near-identical screens.
 *
 * `sourceLabel` travels with the intent because it is a *card display* label
 * ("Main wallet •••• 8421") that the adapter cannot derive: the bank knows
 * account numbers, not what this app calls its cards.
 */
export type TransferIntent = {
  kind: "transfer";
  sourceCardId: CardId;
  sourceLabel: string;
  recipient: Recipient;
  rail: TransferRail;
  amount: Money;
  note: string;
};

export type CashInIntent = {
  kind: "cash-in";
  destinationCardId: CardId;
  destinationLabel: string;
  method: DepositMethod;
  amount: Money;
};

export type BillIntent = {
  kind: "bill";
  sourceCardId: CardId;
  sourceLabel: string;
  biller: Biller;
  accountNumber: string;
  /** Resolved by `directory.validateBillAccount`; shown on review. */
  accountName: string;
  amount: Money;
};

export type QrIntent = {
  kind: "qr";
  sourceCardId: CardId;
  sourceLabel: string;
  instruction: QrInstruction;
  amount: Money;
  note: string;
};

export type PaymentIntent = TransferIntent | CashInIntent | BillIntent | QrIntent;

export type PaymentIntentKind = PaymentIntent["kind"];

/** The transaction this intent becomes once the rail accepts it. */
export const intentTransactionKind = (intent: PaymentIntent): TransactionKind => {
  switch (intent.kind) {
    case "transfer":
      return "transfer-out";
    case "cash-in":
      return "cash-in";
    case "bill":
      return "bill-payment";
    case "qr":
      return "qr-payment";
  }
};

/** Which card the money moves through, whichever direction it is going. */
export const intentCardId = (intent: PaymentIntent): CardId =>
  intent.kind === "cash-in" ? intent.destinationCardId : intent.sourceCardId;

export const intentCardLabel = (intent: PaymentIntent): string =>
  intent.kind === "cash-in" ? intent.destinationLabel : intent.sourceLabel;

/** True when this intent adds to the balance rather than drawing it down. */
export const isIncomingIntent = (intent: PaymentIntent): boolean => intent.kind === "cash-in";

/** Who or what is on the other side, for receipt and activity copy. */
export const intentCounterparty = (intent: PaymentIntent): string => {
  switch (intent.kind) {
    case "transfer":
      return intent.recipient.name;
    case "cash-in":
      return intent.method.title;
    case "bill":
      return intent.biller.name;
    case "qr":
      return intent.instruction.merchantName;
  }
};

export const intentRail = (intent: PaymentIntent): TransferRail | null =>
  intent.kind === "transfer" ? intent.rail : null;

/** The second line under the counterparty: how to recognise who is being paid. */
export const intentCounterpartyDetail = (intent: PaymentIntent): string => {
  switch (intent.kind) {
    case "transfer":
      return intent.recipient.handle;
    case "cash-in":
      return intent.method.detail;
    case "bill":
      return `Account ${intent.accountNumber}`;
    case "qr":
      return intent.instruction.merchantCity;
  }
};

/** Only two kinds carry a user-written note; the others have nothing to show. */
export const intentNote = (intent: PaymentIntent): string =>
  intent.kind === "transfer" || intent.kind === "qr" ? intent.note.trim() : "";

/** Above this, any outgoing payment asks for a PIN or an OTP. */
export const STEP_UP_THRESHOLD = pesos(10_000);

/**
 * Whether this intent needs a confirmation factor before it is submitted.
 *
 * Not every payment does, and that is the point: stepping up on everything
 * trains people to type the PIN without reading the screen. The line is drawn at
 * reversibility.
 *
 * - Cash-in adds money. Nothing to protect.
 * - An internal move stays on the FIN-A ledger and can be unwound by support,
 *   so it never steps up — which is also the behaviour the app already had.
 * - A transfer to another bank is irreversible the moment the rail accepts it,
 *   so it always steps up regardless of size.
 * - Bills and merchant QR have a counterparty who can be chased, so they step up
 *   only once the amount is large.
 */
export const requiresStepUp = (intent: PaymentIntent): boolean => {
  if (intent.kind === "cash-in") return false;
  if (intent.kind === "transfer") return intent.rail !== "internal";
  return compareMoney(intent.amount, STEP_UP_THRESHOLD) >= 0;
};
