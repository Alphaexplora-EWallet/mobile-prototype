import type { QuizQuestion } from "../../domain/quiz";

export const MOCK_QUIZ_QUESTION: QuizQuestion = {
  prompt: "When you want something, what usually happens?",
  step: 3,
  totalSteps: 5,
  answers: [
    { label: "I get it while the feeling is fresh", icon: "wallet" },
    { label: "I check my budget first", icon: "limit" },
    { label: "I save it for later", icon: "bank" },
    { label: "I usually avoid deciding", icon: "more" },
  ],
};
