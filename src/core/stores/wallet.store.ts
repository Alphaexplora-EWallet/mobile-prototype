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
  },
}));

export const walletActions = useWalletStore.getState().actions;
