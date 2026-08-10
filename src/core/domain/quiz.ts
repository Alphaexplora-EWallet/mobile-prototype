import type { IconName } from "./icons";

export type QuizAnswer = {
  label: string;
  icon: IconName;
};

export type QuizQuestion = {
  prompt: string;
  step: number;
  totalSteps: number;
  answers: readonly QuizAnswer[];
};

/** Progress through the quiz, as a percentage of completed steps. */
export const quizProgressPercent = (question: QuizQuestion): number =>
  Math.round((question.step / question.totalSteps) * 100);
