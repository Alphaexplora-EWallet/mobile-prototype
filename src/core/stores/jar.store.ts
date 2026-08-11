import { create } from "zustand";
import type { CardId } from "../domain/card";
import { useWalletStore } from "./wallet.store";

export type JarMoveDirection = "in" | "out";

export const INITIAL_JAR_DRAFT = {
  /** Which way money moves: into the jar from a card, or out of the jar to one. */
  direction: "in" as JarMoveDirection,
  amount: "",
  /** The wallet card on the other side of the move; defaults to the selected one. */
  cardId: "main" as CardId,
};

type JarState = typeof INITIAL_JAR_DRAFT & {
  actions: {
    /** Starts a move in one direction; a fresh amount and the selected card. */
    begin(direction: JarMoveDirection): void;
    setAmount(value: string): void;
    selectCard(id: CardId): void;
    reset(): void;
  };
};

/**
 * The jar-move draft. Like the deposit and transfer drafts, it lives in a store
 * so a half-finished move survives navigating to review and back.
 */
export const useJarStore = create<JarState>()((set, get) => ({
  ...INITIAL_JAR_DRAFT,
  actions: {
    begin: (direction) => {
      if (
        get().direction === direction &&
        get().amount === "" &&
        get().cardId === useWalletStore.getState().selectedCardId
      )
        return;
      set({ direction, amount: "", cardId: useWalletStore.getState().selectedCardId });
    },
    setAmount: (amount) => set({ amount }),
    selectCard: (cardId) => {
      if (get().cardId === cardId) return;
      set({ cardId });
    },
    reset: () => set(INITIAL_JAR_DRAFT),
  },
}));

export const jarActions = useJarStore.getState().actions;
