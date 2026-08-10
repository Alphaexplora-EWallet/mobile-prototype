import { BrandMark } from "../layout/BrandMark";
import { Icon } from "../primitives/Icon";
import { Trait } from "../primitives/Trait";
import { useResultViewModel } from "@/core/viewmodels/useOnboardingViewModel";

export function ResultScreen() {
  const { continue: proceed, close } = useResultViewModel();

  return (
    <div className="onboarding-page result-page">
      <header className="split-app-bar">
        <BrandMark compact />
        <button className="icon-button" type="button" onClick={close} aria-label="Close result">
          ×
        </button>
      </header>

      <section className="result-content">
        <p className="eyebrow">Meet your money style</p>
        <h1>The Free Spirit</h1>
        <p className="result-label">Spender profile</p>

        <div className="wallet-character" aria-hidden="true">
          <span className="character-sun">☀</span>
          <div className="character-orbit" />
          <div className="character-wallet">
            <span>⌣</span>
          </div>
          <span className="character-star character-star-one">✦</span>
          <span className="character-star character-star-two">✧</span>
        </div>

        <p className="result-description">
          You enjoy the moment and value freedom. FIN-A will help you spend with intention—without taking away the fun.
        </p>

        <div className="trait-row" aria-label="Your money style traits">
          <Trait icon={<Icon name="bolt" />} label="Spontaneous" />
          <Trait icon={<span className="palm-glyph">♨</span>} label="Experience-led" />
          <Trait icon={<Icon name="heart" />} label="Big-hearted" />
        </div>

        <p className="growth-note">
          <span>✧</span> Money styles can change as your habits grow.
        </p>
      </section>

      <div className="sticky-action onboarding-action">
        <button className="primary-button" type="button" onClick={proceed}>
          Build my plan
        </button>
      </div>
    </div>
  );
}
