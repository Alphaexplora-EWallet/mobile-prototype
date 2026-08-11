import { useEffect, useState } from "react";
import type { VirtualAccount } from "../domain/account";
import { railName } from "../domain/rails";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { usePlatform } from "../platform/PlatformContext";
import { useSelectedCard } from "./useCardViews";

/**
 * The inbound rail, which the app had no screen for at all.
 *
 * This is the canonical BaaS cash-in: the provider issues a real account number,
 * other banks push to it over InstaPay or PESONet, and the wallet credits when
 * the rail settles. Nothing here "pulls" money, because nothing can.
 */
export function useFundWalletViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const platform = usePlatform();
  const card = useSelectedCard();

  const [account, setAccount] = useState<VirtualAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    void gateway.accounts.list().then(async (accounts) => {
      if (!active) return;
      if (!accounts.ok) {
        setError(accounts.error.message);
        setIsLoading(false);
        return;
      }
      const match = accounts.value.find((candidate) => candidate.cardId === card.id);
      if (!match) {
        setError("That wallet cannot receive a bank transfer.");
        setIsLoading(false);
        return;
      }
      const result = await gateway.accounts.virtualAccount(match.id);
      if (!active) return;
      if (result.ok) setAccount(result.value);
      else setError(result.error.message);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [gateway, card.id]);

  return {
    title: "Fund your wallet",
    intro: "Send money to this account from any Philippine bank. It lands in your FIN-A wallet.",
    walletLabel: `${card.displayLabel} •••• ${card.last4}`,
    isLoading,
    error,
    account: account
      ? {
          accountNumber: account.accountNumber,
          /** Grouped for reading aloud and for checking digit by digit. */
          accountNumberLabel: account.accountNumber.replace(/(\d{4})(?=\d)/g, "$1 "),
          bankName: account.bankName,
          accountName: account.accountName,
          railsLabel: account.rails.map(railName).join(" or "),
          instructions: account.instructions,
        }
      : null,
    copied,
    copyAccountNumber: async () => {
      if (!account) return;
      const ok = await platform.clipboard.setString(account.accountNumber);
      setCopied(ok);
      if (!ok) setError("We could not copy that. Write the number down instead.");
    },
    back: navigation.goBack,
  };
}
