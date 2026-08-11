import { useEffect, useState } from "react";
import { maskAccountNumber } from "../domain/payments";
import type { AccountStatus } from "../domain/account";
import type { Bank } from "../domain/rails";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { accountsActions, useAccountsStore } from "../stores/accounts.store";

const STATUS_LABEL: Readonly<Record<AccountStatus, string>> = {
  active: "Active",
  restricted: "Restricted",
  closed: "Closed",
};

/**
 * GAP-09 — linked bank accounts management. Lists the accounts seeded from
 * `MOCK_ACCOUNTS`, marks one as the default transfer source, links new ones,
 * and removes them — except the last one, whose removal would leave the wallet
 * with no transfer source at all.
 *
 * The bank directory for the link form comes from the gateway, matching the
 * destination screen; the link itself is a pure store mutation (the simulated
 * bank does not verify micro-deposits).
 */
export function useLinkedAccountsViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const accounts = useAccountsStore((state) => state.accounts);
  const defaultAccountId = useAccountsStore((state) => state.defaultAccountId);

  /** The bank directory for the link form, minus FIN-A's internal rail. */
  const [banks, setBanks] = useState<readonly Bank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  /** The link-form draft. Local state: it is a one-shot form, not a resumable flow. */
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [showForm, setShowForm] = useState(false);
  /** The blocked-removal message, shown through the StateBlock error surface. */
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void gateway.directory.banks().then((result) => {
      if (!active) return;
      if (result.ok) setBanks(result.value.filter((bank) => !bank.rails.includes("internal")));
      else setNotice(result.error.message);
      setIsLoadingBanks(false);
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  const selectedBank = banks.find((bank) => bank.code === bankCode) ?? null;
  const digits = accountNumber.replace(/\s/g, "");
  const canSave = Boolean(selectedBank && digits.length >= 10 && accountName.trim().length > 0);

  const save = () => {
    if (!selectedBank || !canSave) return;
    accountsActions.add({
      bankName: selectedBank.name,
      accountName: accountName.trim(),
      accountNumber: digits,
      status: "active",
    });
    setBankCode("");
    setAccountNumber("");
    setAccountName("");
    setShowForm(false);
    setNotice(null);
  };

  const remove = (id: string) => {
    const result = accountsActions.remove(id);
    setNotice(result.ok ? null : result.message);
  };

  return {
    title: "Linked accounts",
    intro: "Bank accounts you can send money from. The last one cannot be removed — it would leave no transfer source.",
    items: accounts.map((account) => ({
      id: account.id,
      bankName: account.bankName,
      accountName: account.accountName,
      handle: maskAccountNumber(account.accountNumber),
      statusLabel: STATUS_LABEL[account.status],
      isDefault: account.id === defaultAccountId,
    })),
    setDefault: accountsActions.setDefault,
    remove,
    notice,
    showForm,
    toggleForm: () => setShowForm((visible) => !visible),
    isLoadingBanks,
    banks: banks.map((bank) => ({
      id: bank.code,
      title: bank.shortName,
      detail: bank.name,
      selected: bank.code === bankCode,
    })),
    selectBank: setBankCode,
    accountNumber,
    setAccountNumber: (value: string) => setAccountNumber(value.replace(/[^\d\s]/g, "")),
    accountName,
    setAccountName,
    canSave,
    save,
    back: navigation.goBack,
  };
}
