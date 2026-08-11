import { create } from "zustand";
import type { CardDefinition, CardId } from "../domain/card";
import { INITIAL_FROZEN, MOCK_CARDS } from "../data/mock/cards.mock";
import { type Money, pesos } from "../money/money";

export type WalletState = {
  cards: readonly CardDefinition[];
  selectedCardId: CardId;
  frozen: Readonly<Record<CardId, boolean>>;
  onlinePayments: boolean;
  atmWithdrawals: boolean;
  limits: Readonly<Partial<Record<CardId, Money>>>;
  actions: {
    selectCard(id: CardId): void;
    setFrozen(id: CardId, frozen: boolean): void;
    toggleFrozen(id: CardId): void;
    setOnlinePayments(enabled: boolean): void;
    setAtmWithdrawals(enabled: boolean): void;
    setSpendingLimit(id: CardId, limit: Money): void;
    /**
     * Balances come from the bank, not from this store's arithmetic. The gateway
     * settles a payment and this pushes the result in, so the wallet is a cache
     * of the bank's answer rather than a second ledger that could disagree.
     */
    setBalances(balances: Readonly<Partial<Record<CardId, Money>>>): void;
  };
};

export const useWalletStore = create<WalletState>()((set, get) => ({
  cards: MOCK_CARDS,
  selectedCardId: "main",
  frozen: INITIAL_FROZEN,
  onlinePayments: true,
  atmWithdrawals: true,
  limits: { main: pesos(3_000), travel: pesos(3_000) },
  actions: {
    selectCard: (id) => {
      if (get().selectedCardId === id) return; // no-op writes still wake subscribers
      set({ selectedCardId: id });
    },
    setFrozen: (id, frozen) => set((state) => ({ frozen: { ...state.frozen, [id]: frozen } })),
    toggleFrozen: (id) => set((state) => ({ frozen: { ...state.frozen, [id]: !state.frozen[id] } })),
    setOnlinePayments: (enabled) => set({ onlinePayments: enabled }),
    setAtmWithdrawals: (enabled) => set({ atmWithdrawals: enabled }),
    setSpendingLimit: (id, limit) => set((state) => ({ limits: { ...state.limits, [id]: limit } })),
    setBalances: (balances) =>
      set((state) => {
        const next = state.cards.map((card) => {
          const balance = balances[card.id];
          return balance && balance.amount !== card.balance.amount ? { ...card, balance } : card;
        });
        // Equal writes still wake subscribers, so bail when nothing moved.
        return next.every((card, index) => card === state.cards[index]) ? {} : { cards: next };
      }),
  },
}));

export const walletActions = useWalletStore.getState().actions;
