import { useState } from "react";
import type { QuizQuestion } from "../domain/quiz";
import { quizProgressPercent } from "../domain/quiz";
import { levelFromXp } from "../domain/progress";
import { MOCK_MONEY_STYLE, MOCK_QUIZ_QUESTION } from "../data/mock/quiz.mock";
import { formatMoney } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { questActions, useQuestStore } from "../stores/quest.store";
import { walletActions } from "../stores/wallet.store";

/**
 * The onboarding and result screens are mostly static copy, so their
 * ViewModels are thin. They exist anyway: a boundary with exceptions is a
 * boundary nobody enforces, and "views never read stores" is worth more than
 * the few lines it costs here.
 */

export function useWelcomeViewModel() {
  const navigation = useNavigation();
  return {
    /**
     * Used to open the quiz, which meant the primary action of the app created
     * nothing. It starts registration now; the quiz follows once there is an
     * account to attach an answer to. Sign-in lives in `useAuthViewModel`.
     */
    start: () => navigation.navigate("sign-up"),
    signIn: () => navigation.navigate("sign-in"),
  };
}

export function useQuizViewModel(): {
  question: QuizQuestion;
  progressLabel: string;
  progressPercent: number;
  selectedIndex: number;
  select(index: number): void;
  submit(): void;
  back(): void;
} {
  const navigation = useNavigation();
  const [selectedIndex, select] = useState(0);
  const question = MOCK_QUIZ_QUESTION;
  return {
    question,
    progressLabel: `${question.step} of ${question.totalSteps}`,
    progressPercent: quizProgressPercent(question),
    selectedIndex,
    select,
    submit: () => navigation.navigate("result"),
    /** The back arrow was rendered with no handler at all. */
    back: navigation.goBack,
  };
}

/**
 * "Build my plan" and the close × used to run the same `resetTo("home")`: two
 * controls, one behaviour, and no plan. The plan the copy is promising is the
 * quest — a spending limit to set and track — so the primary action goes there.
 * Quest is a tab, so `navigate` roots the stack on it and onboarding does not
 * stay behind the back button.
 */
export function useResultViewModel() {
  const navigation = useNavigation();
  return {
    styleName: MOCK_MONEY_STYLE.name,
    continue: () => navigation.navigate("quest"),
    /**
     * The × now offers verification rather than dropping straight to Home: a new
     * wallet is unverified, and this is the one moment in onboarding where the
     * user has finished something and is not mid-task. Someone who takes "Build
     * my plan" instead meets the same prompt on Profile.
     */
    close: () => navigation.navigate("verify-identity"),
  };
}

export function useRewardViewModel() {
  const navigation = useNavigation();
  const quest = useQuestStore((state) => state.quest);
  /**
   * The quest has already paid out by the time this screen renders
   * (`questActions.complete` awards the XP), so this is the level *after* the
   * reward — which is what a screen announcing "80 XP earned" should show.
   */
  const level = levelFromXp(useQuestStore((state) => state.xpTotal));
  return {
    xpEarned: quest.xpReward,
    limitLabel: formatMoney(quest.limit, { fractionDigits: 0 }),
    rewardName: quest.rewardName,
    levelLabel: `Level ${level.level}`,
    nextLevelLabel: `Level ${level.level + 1}`,
    levelPercent: level.percent,
    apply: () => {
      questActions.applyRewardStyle();
      walletActions.selectCard("travel");
      navigation.navigate("wallet");
    },
    home: () => navigation.navigate("home"),
  };
}
