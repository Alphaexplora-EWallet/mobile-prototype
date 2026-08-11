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
 * The jar balance is the same cache discipline: the bank owns it, so it is
 * re-read alongside the cards rather than recomputed here.
 */
export async function syncBalances(gateway: BankingGateway): Promise<void> {
  const [accountsResult, jarResult] = await Promise.all([gateway.accounts.list(), gateway.payments.jarState()]);
  if (accountsResult.ok) {
    const balances = accountsResult.value.reduce<Partial<Record<CardId, Money>>>(
      (accumulated, account) => ({ ...accumulated, [account.cardId]: account.balance }),
      {},
    );
    walletActions.setBalances(balances);
  }
  if (jarResult.ok) walletActions.setJarState(jarResult.value);
}
