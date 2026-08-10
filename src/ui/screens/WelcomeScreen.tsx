import { BrandMark } from "../layout/BrandMark";
import { IMAGERY } from "../assets";

export function WelcomeScreen({ onStart, onSignIn }: { onStart: () => void; onSignIn: () => void }) {
  return (
    <div className="onboarding-page welcome-page">
      <header className="welcome-logo">
        <BrandMark tagline />
      </header>
      <section className="welcome-copy">
        <h1>
          Money that
          <br />
          follows your life
        </h1>
        <p>
          Turn meals, rides, savings,
          <br />
          and transfers into rewards.
        </p>
      </section>

      <figure className="welcome-visual">
        <img
          src={IMAGERY.welcomeManila}
          alt="Friends walking through a sunny Manila street beside a jeepney and neighborhood store"
        />
        <span className="welcome-visual-fade" />
      </figure>

      <div className="welcome-actions">
        <button className="primary-button welcome-primary" type="button" onClick={onStart}>
          <span>✦</span> Start my journey <b>›</b>
        </button>
        <button className="secondary-button" type="button" onClick={onSignIn}>
          I already have an account
        </button>
        <div className="welcome-dots" aria-label="Welcome step 1 of 3">
          <span className="is-active" />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
