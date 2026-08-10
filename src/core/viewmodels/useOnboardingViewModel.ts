import { useState } from "react";
import type { QuizQuestion } from "../domain/quiz";
import { quizProgressPercent } from "../domain/quiz";
import { MOCK_QUIZ_QUESTION } from "../data/mock/quiz.mock";
import { MOCK_CARDHOLDER } from "../data/mock/cards.mock";
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
    start: () => navigation.navigate("quiz"),
    signIn: () => navigation.navigate("sign-in"),
  };
}

export function useSignInViewModel() {
  const navigation = useNavigation();
  return {
    back: () => navigation.navigate("welcome"),
    submit: () => navigation.resetTo("home"),
  };
}

export function useQuizViewModel(): {
  question: QuizQuestion;
  progressLabel: string;
  progressPercent: number;
  selectedIndex: number;
  select(index: number): void;
  submit(): void;
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
  };
}

export function useResultViewModel() {
  const navigation = useNavigation();
  return {
    styleName: "The Free Spirit",
    continue: () => navigation.resetTo("home"),
    close: () => navigation.resetTo("home"),
  };
}

export function useRewardViewModel() {
  const navigation = useNavigation();
  const quest = useQuestStore((state) => state.quest);
  return {
    xpEarned: quest.xpReward,
    limitLabel: quest.limitLabel,
    rewardName: quest.rewardName,
    apply: () => {
      questActions.applyRewardStyle();
      walletActions.selectCard("travel");
      navigation.navigate("wallet");
    },
    home: () => navigation.navigate("home"),
  };
}

export function useProfileViewModel() {
  const navigation = useNavigation();
  return {
    name: MOCK_CARDHOLDER.name,
    styleLine: "The Free Spirit · Level 3",
    levelPercent: 75,
    retakeQuiz: () => navigation.navigate("quiz"),
  };
}
