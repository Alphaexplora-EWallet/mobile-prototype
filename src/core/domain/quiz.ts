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

/**
 * The quiz's verdict. Scoring does not exist yet — the result is always the same
 * one, which the README lists as a known shortcut — but the *name* was being
 * retyped as a string literal on Result, Home and Profile, so it lives here.
 */
export type MoneyStyle = {
  name: string;
  blurb: string;
};

/** Progress through the quiz, as a percentage of completed steps. */
export const quizProgressPercent = (question: QuizQuestion): number =>
  Math.round((question.step / question.totalSteps) * 100);
