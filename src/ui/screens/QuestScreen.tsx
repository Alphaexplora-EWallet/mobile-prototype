import { Icon } from "../primitives/Icon";
import { IMAGERY } from "../assets";

export function QuestScreen({
  isTracking,
  onBack,
  onSetLimit,
  onComplete,
}: {
  isTracking: boolean;
  onBack: () => void;
  onSetLimit: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="tab-page quest-page">
      <header className="centered-app-bar page-app-bar">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back to home">
          <Icon name="arrow-left" />
        </button>
        <strong>Quest</strong>
        <button className="icon-button clear-button" type="button" aria-label="Quest options">
          <Icon name="more" />
        </button>
      </header>

      <section className="quest-title-block">
        <span className="large-quest-icon">
          <Icon name="target" />
        </span>
        <div>
          <h1>Keep today intentional</h1>
          <p>Stay within the limit you chose and make every peso count.</p>
        </div>
      </section>

      {isTracking && (
        <div className="tracking-status">
          <Icon name="check" />
          <span>
            <strong>₱3,000 limit active</strong>
            <small>Your quest is now tracking today’s spending.</small>
          </span>
        </div>
      )}

      <section className="quest-ring-wrap" aria-label="41 percent of the daily limit used">
        <div className="quest-ring">
          <div>
            <strong>₱1,240</strong>
            <span>spent</span>
            <i />
            <b>₱1,760</b>
            <span>left today</span>
          </div>
        </div>
        <span className="ring-percent">41%</span>
      </section>

      <section className="why-section">
        <h2>
          <span>✦</span> Why this fits you
        </h2>
        <p>
          You value freedom and experiences.
          <br />A clear limit keeps the fun without the regret.
        </p>
      </section>

      <section className="reward-strip">
        <span className="xp-star">
          <Icon name="star" />
        </span>
        <span>
          <strong>80 XP</strong>
          <small>Reward</small>
        </span>
        <i />
        <img src={IMAGERY.sunsetJeepney} alt="Sunset Ride card preview" />
        <span>
          <small>Unlock</small>
          <strong className="teal-text">Sunset Ride</strong>
          <small>card style</small>
        </span>
      </section>

      <div className="quest-actions">
        <button className="primary-button" type="button" onClick={isTracking ? onComplete : onSetLimit}>
          {isTracking ? "Preview end-of-day result" : "Set ₱3,000 limit"}
        </button>
        <button className="text-button" type="button" onClick={isTracking ? onBack : onSetLimit}>
          {isTracking ? "Back to home" : "Choose another amount"}
        </button>
      </div>
    </div>
  );
}
