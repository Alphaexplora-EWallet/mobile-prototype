import { BrandMark } from "../layout/BrandMark";
import { Icon } from "../primitives/Icon";
import { useQuizViewModel } from "@/core/viewmodels/useOnboardingViewModel";

export function QuizScreen() {
  const { question, progressLabel, progressPercent, selectedIndex, select, submit, back } = useQuizViewModel();

  return (
    <div className="onboarding-page quiz-page">
      <header className="centered-app-bar">
        <button className="icon-button" type="button" aria-label="Go back" onClick={back}>
          <Icon name="arrow-left" />
        </button>
        <BrandMark compact />
        <span className="app-bar-spacer" />
      </header>

      <section className="quiz-intro">
        <h1>Find your money style</h1>
        <div className="progress-heading">
          <strong>{progressLabel}</strong>
        </div>
        <div className="progress-track" aria-label={`Question ${progressLabel}`}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      </section>

      <div className="orbit-accent" aria-hidden="true">
        <span>✦</span>
      </div>

      <fieldset className="answer-list">
        <legend>{question.prompt}</legend>
        {question.answers.map((answer, index) => (
          <button
            className={`answer-option ${selectedIndex === index ? "is-selected" : ""}`}
            key={answer.label}
            type="button"
            aria-pressed={selectedIndex === index}
            onClick={() => select(index)}
          >
            <span className="answer-icon">
              <Icon name={answer.icon} />
            </span>
            <span>{answer.label}</span>
            {selectedIndex === index && (
              <span className="answer-check">
                <Icon name="check" />
              </span>
            )}
          </button>
        ))}
      </fieldset>

      <div className="sticky-action onboarding-action">
        <button className="primary-button" type="button" onClick={submit}>
          Continue
        </button>
      </div>
    </div>
  );
}
