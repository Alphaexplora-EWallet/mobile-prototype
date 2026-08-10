import { MOCK_QUIZ_QUESTION } from "@/core/data/mock/quiz.mock";
import { BrandMark } from "../layout/BrandMark";
import { Icon } from "../primitives/Icon";

export function QuizScreen({
  selected,
  onSelect,
  onContinue,
}: {
  selected: number;
  onSelect: (value: number) => void;
  onContinue: () => void;
}) {
  return (
    <div className="onboarding-page quiz-page">
      <header className="centered-app-bar">
        <button className="icon-button" type="button" aria-label="Go back">
          <Icon name="arrow-left" />
        </button>
        <BrandMark compact />
        <span className="app-bar-spacer" />
      </header>

      <section className="quiz-intro">
        <h1>Find your money style</h1>
        <div className="progress-heading">
          <strong>3 of 5</strong>
        </div>
        <div className="progress-track" aria-label="Question 3 of 5">
          <span style={{ width: "60%" }} />
        </div>
      </section>

      <div className="orbit-accent" aria-hidden="true">
        <span>✦</span>
      </div>

      <fieldset className="answer-list">
        <legend>When you want something, what usually happens?</legend>
        {MOCK_QUIZ_QUESTION.answers.map((answer, index) => (
          <button
            className={`answer-option ${selected === index ? "is-selected" : ""}`}
            key={answer.label}
            type="button"
            aria-pressed={selected === index}
            onClick={() => onSelect(index)}
          >
            <span className="answer-icon">
              <Icon name={answer.icon} />
            </span>
            <span>{answer.label}</span>
            {selected === index && (
              <span className="answer-check">
                <Icon name="check" />
              </span>
            )}
          </button>
        ))}
      </fieldset>

      <div className="sticky-action onboarding-action">
        <button className="primary-button" type="button" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
