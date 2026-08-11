import { create } from "zustand";
import type { LinkedBankAccount } from "../domain/account";
import { MOCK_ACCOUNTS } from "../data/mock/accounts.mock";

/**
 * The wallet's linked bank accounts — the recognisable layer behind the card
 * faces the transfer source pickers show. Seeded from `MOCK_ACCOUNTS`;
 * add / remove / set-default are pure client mutations, which is the point: a
 * real adapter would verify a link with a micro-deposit or an OTP, and this
 * prototype simulates that by accepting the entry outright (A2).
 */
export const seedLinkedAccounts = (): readonly LinkedBankAccount[] =>
  MOCK_ACCOUNTS.map(({ id, bankName, accountName, accountNumber, status }) => ({
    id,
    bankName,
    accountName,
    accountNumber,
    status,
  }));

export const INITIAL_ACCOUNTS = {
  accounts: seedLinkedAccounts(),
  /** The linked account a transfer source picker preselects. */
  defaultAccountId: MOCK_ACCOUNTS[0].id,
};

/** Shown when the last remaining account cannot be removed. */
export const ONLY_ACCOUNT_BLOCK_MESSAGE =
  "This is your only transfer source. Link another bank account before removing it.";

export type RemoveResult = { ok: true } | { ok: false; message: string };

type AccountsState = typeof INITIAL_ACCOUNTS & {
  actions: {
    /** Links an account; a no-op when that bank + number is already linked. */
    add(input: Omit<LinkedBankAccount, "id">): void;
    /** Removing the only account is blocked with a message. */
    remove(id: string): RemoveResult;
    setDefault(id: string): void;
  };
};

export const useAccountsStore = create<AccountsState>()((set, get) => ({
  ...INITIAL_ACCOUNTS,
  actions: {
    add: (input) => {
      // Deterministic id, in the same spirit as the mock gateway deriving
      // stable results from input: re-linking the same account is a no-op.
      const id = `acct-${input.bankName}-${input.accountNumber}`;
      if (get().accounts.some((account) => account.id === id)) return;
      set((state) => ({ accounts: [...state.accounts, { ...input, id }] }));
    },
    remove: (id) => {
      const { accounts, defaultAccountId } = get();
      if (!accounts.some((account) => account.id === id)) return { ok: true };
      if (accounts.length === 1) return { ok: false, message: ONLY_ACCOUNT_BLOCK_MESSAGE };
      const remaining = accounts.filter((account) => account.id !== id);
      set({
        accounts: remaining,
        // Removing the default promotes the next account, so the app always
        // has a source to preselect.
        defaultAccountId: defaultAccountId === id ? remaining[0].id : defaultAccountId,
      });
      return { ok: true };
    },
    setDefault: (id) => {
      if (get().defaultAccountId === id) return;
      if (!get().accounts.some((account) => account.id === id)) return;
      set({ defaultAccountId: id });
    },
  },
}));

export const accountsActions = useAccountsStore.getState().actions;
