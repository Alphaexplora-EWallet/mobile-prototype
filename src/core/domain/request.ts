import type { Money } from "../money/money";
import type { Recipient } from "./payments";

/**
 * The lifecycle of a peer money request, from the requester's point of view.
 *
 * A request is *not* a bank transaction: nothing moves when it is created. The
 * payer's side stays off-ledger until the request is accepted, at which point
 * the acceptance is executed as a real payment through the shared pipeline —
 * which is exactly why `MoneyRequestStatus` has no "paid" member: being paid
 * *is* `accepted`, and the receipt of the resulting payment is the proof.
 */
export type MoneyRequestStatus = "pending" | "accepted" | "rejected";

export type MoneyRequest = {
  id: string;
  /** The saved recipient asked to pay — the payer once the request is accepted. */
  payer: Recipient;
  amount: Money;
  note: string;
  status: MoneyRequestStatus;
  /** Display string, consistent with `Transaction.when`; not a Date. */
  when: string;
};

export const requestStatusLabel = (status: MoneyRequestStatus): string => {
  if (status === "pending") return "Pending";
  if (status === "accepted") return "Accepted";
  return "Rejected";
};

export type RequestAmountIssue = "empty";

/**
 * Why a requested amount cannot be sent. The amount is the only free input on
 * the request screen (the payer is picked from saved recipients, never typed),
 * so this is the whole eligibility surface.
 */
export const validateRequestAmount = (amount: Money | null): RequestAmountIssue | null =>
  amount === null || amount.amount <= 0 ? "empty" : null;

export const requestAmountErrorMessage = (issue: RequestAmountIssue): string =>
  issue === "empty" ? "Enter the amount you want to request." : "";
