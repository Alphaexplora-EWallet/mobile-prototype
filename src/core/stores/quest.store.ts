import { create } from "zustand";

/**
 * The quest's lifecycle as one value rather than three booleans.
 *
 * Previously limitConfirmed / rewardUnlocked / cardStyleApplied were separate
 * flags, which made states like "reward unlocked but limit never confirmed"
 * representable even though they are meaningless.
 */
export type QuestPhase = "available" | "tracking" | "completed";

export type QuestState = {
  phase: QuestPhase;
  /** True while the user is being walked through setting a limit on the Wallet screen. */
  limitSetupActive: boolean;
  /** Applying the unlocked card style is a separate, optional choice. */
  rewardStyleApplied: boolean;
  quest: {
    title: string;
    /** The home card sets this title over two lines; the break is content, not styling. */
    titleLines: readonly string[];
    spentLabel: string;
    limitLabel: string;
    remainingLabel: string;
    /**
     * Hardcoded, matching the conic-gradient in quest.css. Deriving it from the
     * amounts would give 41.33% here while the ring stayed at 41%.
     */
    progressPercent: number;
    hoursLeftLabel: string;
    xpReward: number;
    rewardName: string;
  };
  actions: {
    beginLimitSetup(): void;
    cancelLimitSetup(): void;
    confirmLimit(): void;
    complete(): void;
    applyRewardStyle(): void;
  };
};

export const useQuestStore = create<QuestState>()((set) => ({
  phase: "available",
  limitSetupActive: false,
  rewardStyleApplied: false,
  quest: {
    title: "Keep today intentional",
    titleLines: ["Keep today", "intentional"],
    spentLabel: "₱1,240",
    limitLabel: "₱3,000",
    remainingLabel: "₱1,760",
    progressPercent: 41,
    hoursLeftLabel: "2h left today",
    xpReward: 80,
    rewardName: "Sunset Ride",
  },
  actions: {
    beginLimitSetup: () => set({ limitSetupActive: true }),
    cancelLimitSetup: () => set({ limitSetupActive: false }),
    confirmLimit: () => set({ limitSetupActive: false, phase: "tracking" }),
    complete: () => set({ phase: "completed" }),
    applyRewardStyle: () => set({ rewardStyleApplied: true }),
  },
}));

export const questActions = useQuestStore.getState().actions;

/** The reward exists once the quest is finished. */
export const isRewardUnlocked = (phase: QuestPhase) => phase === "completed";
