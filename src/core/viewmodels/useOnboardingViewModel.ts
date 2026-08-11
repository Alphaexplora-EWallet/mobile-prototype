import { useState } from "react";
import type { QuizQuestion } from "../domain/quiz";
import { quizProgressPercent } from "../domain/quiz";
import { MOCK_QUIZ_QUESTION } from "../data/mock/quiz.mock";
import { MOCK_CARDHOLDER } from "../data/mock/cards.mock";
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
    start: () => navigation.navigate("quiz"),
    signIn: () => navigation.navigate("sign-in"),
  };
}

export function useSignInViewModel() {
  const navigation = useNavigation();
  return {
    back: () => navigation.navigate("welcome"),
    /**
     * The demo button still lands straight on Home. The credential form now goes
     * through a one-time code instead, which is what the email and password were
     * always implying and never doing.
     */
    submit: () => navigation.resetTo("home"),
    signInWithCredentials: () => navigation.navigate("sign-in-otp"),
    forgotPassword: () => navigation.navigate("forgot-password"),
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
    limitLabel: formatMoney(quest.limit, { fractionDigits: 0 }),
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
    openSettings: () => navigation.navigate("settings"),
  };
}
