import { create } from "zustand";
import { type Money, pesos } from "../money/money";

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
  /**
   * Lifetime XP. Home, Profile and Reward all derive their level and progress
   * bar from this one number through `levelFromXp`, instead of each carrying its
   * own literal. 1,375 is chosen so the displayed level and percentage are
   * unchanged from the values those screens used to hardcode: level 3, 75%.
   */
  xpTotal: number;
  quest: {
    title: string;
    /** The home card sets this title over two lines; the break is content, not styling. */
    titleLines: readonly string[];
    spent: Money;
    limit: Money;
    remaining: Money;
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

/**
 * Chosen so `levelFromXp` reproduces exactly what Home, Profile and Reward used
 * to hardcode: level 3, three quarters of the way to level 4. Exported because
 * `resetStores` has to restore it, and a second copy of the number here would be
 * the very drift this change removes.
 */
export const INITIAL_QUEST_XP = 1_375;

export const useQuestStore = create<QuestState>()((set) => ({
  phase: "available",
  limitSetupActive: false,
  rewardStyleApplied: false,
  xpTotal: INITIAL_QUEST_XP,
  quest: {
    title: "Keep today intentional",
    titleLines: ["Keep today", "intentional"],
    spent: pesos(1_240),
    limit: pesos(3_000),
    remaining: pesos(1_760),
    progressPercent: 41,
    hoursLeftLabel: "2h left today",
    xpReward: 80,
    rewardName: "Sunset Ride",
  },
  actions: {
    beginLimitSetup: () => set({ limitSetupActive: true }),
    cancelLimitSetup: () => set({ limitSetupActive: false }),
    confirmLimit: () => set({ limitSetupActive: false, phase: "tracking" }),
    /**
     * Finishing the quest is what pays the XP out, so the Reward screen and
     * every level bar in the app agree without anyone adding the reward on by
     * hand. Guarded on phase: completing twice would pay twice.
     */
    complete: () =>
      set((state) =>
        state.phase === "completed" ? state : { phase: "completed", xpTotal: state.xpTotal + state.quest.xpReward },
      ),
    applyRewardStyle: () => set({ rewardStyleApplied: true }),
  },
}));

export const questActions = useQuestStore.getState().actions;

/** The reward exists once the quest is finished. */
export const isRewardUnlocked = (phase: QuestPhase) => phase === "completed";
