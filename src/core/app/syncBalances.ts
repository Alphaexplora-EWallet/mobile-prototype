import type { CardId } from "../domain/card";
import type { Money } from "../money/money";
import type { BankingGateway } from "../platform/bankingGateway";
import { walletActions } from "../stores/wallet.store";

/**
 * Pulls the bank's balances into the wallet store after money moves.
 *
 * The alternative — subtracting the amount locally — means the app keeps a
 * second ledger that can drift from the bank's. Re-reading is one extra call and
 * is what a real client does after a payment, including when a fee it did not
 * predict was applied.
 *
 * Failures are swallowed on purpose: a stale balance is a cosmetic problem and
 * the payment already succeeded, so there is nothing useful to tell the user.
 */
export async function syncBalances(gateway: BankingGateway): Promise<void> {
  const result = await gateway.accounts.list();
  if (!result.ok) return;
  const balances = result.value.reduce<Partial<Record<CardId, Money>>>(
    (accumulated, account) => ({ ...accumulated, [account.cardId]: account.balance }),
    {},
  );
  walletActions.setBalances(balances);
}
