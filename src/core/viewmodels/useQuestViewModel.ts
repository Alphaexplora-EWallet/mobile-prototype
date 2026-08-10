import { useNavigation } from "../navigation/useNavigation";
import { questActions, useQuestStore } from "../stores/quest.store";
import { walletActions } from "../stores/wallet.store";

export type QuestViewModel = {
  title: string;
  spentLabel: string;
  limitLabel: string;
  remainingLabel: string;
  progressPercent: number;
  hoursLeftLabel: string;
  xpReward: number;
  rewardName: string;
  isTracking: boolean;
  trackingNote: string;
  primaryLabel: string;
  secondaryLabel: string;
  pressPrimary(): void;
  pressSecondary(): void;
  back(): void;
};

export function useQuestViewModel(): QuestViewModel {
  const navigation = useNavigation();
  const quest = useQuestStore((state) => state.quest);
  const phase = useQuestStore((state) => state.phase);
  const isTracking = phase !== "available";

  // The limit is set on the main card, so the quest selects it before sending
  // the user to Wallet.
  const beginLimitSetup = () => {
    walletActions.selectCard("main");
    questActions.beginLimitSetup();
    navigation.navigate("wallet");
  };

  const complete = () => {
    questActions.complete();
    navigation.navigate("reward");
  };

  return {
    ...quest,
    isTracking,
    trackingNote: `${quest.limitLabel} limit active`,
    primaryLabel: isTracking ? "Preview end-of-day result" : `Set ${quest.limitLabel} limit`,
    secondaryLabel: isTracking ? "Back to home" : "Choose another amount",
    pressPrimary: isTracking ? complete : beginLimitSetup,
    pressSecondary: isTracking ? () => navigation.navigate("home") : beginLimitSetup,
    back: () => navigation.navigate("home"),
  };
}
