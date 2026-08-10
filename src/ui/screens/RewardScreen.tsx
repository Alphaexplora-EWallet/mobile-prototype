import { BrandMark } from "../layout/BrandMark";
import { IMAGERY } from "../assets";

export function RewardScreen({ onApply, onHome }: { onApply: () => void; onHome: () => void }) {
  return (
    <div className="onboarding-page reward-page">
      <header>
        <BrandMark compact />
      </header>
      <section className="reward-content">
        <div className="celebration-orbit" aria-hidden="true">
          <span>✦</span>
          <i>✧</i>
          <b>✦</b>
        </div>
        <p className="eyebrow">Quest complete</p>
        <h1>You kept it intentional</h1>
        <p>You stayed within your ₱3,000 limit today.</p>
        <div className="xp-earned">
          <strong>80</strong>
          <b>XP</b>
          <span>earned</span>
        </div>
        <div className="level-progress">
          <span>
            <b>Level 3</b>
            <b>Level 4</b>
          </span>
          <div className="progress-track">
            <i style={{ width: "76%" }} />
          </div>
        </div>

        <div className="unlocked-card">
          <img src={IMAGERY.sunsetJeepney} alt="Jeepney traveling along the coast at sunset" />
          <span className="card-overlay" />
          <span className="card-top">
            <BrandMark compact preserveInk />
            <small>debit</small>
          </span>
          <span className="card-middle">
            <span className="chip" />
            <span className="contactless">)))</span>
          </span>
          <span className="card-number">•••• 8421</span>
          <span className="unlocked-card-name">
            <strong>Sunset Ride</strong>
            <small>✦ Just unlocked</small>
          </span>
          <b className="visa">VISA</b>
          <span className="new-badge">
            New
            <br />
            style
          </span>
        </div>
      </section>
      <div className="reward-actions">
        <button className="primary-button" type="button" onClick={onApply}>
          Use this card style
        </button>
        <button className="secondary-button" type="button" onClick={onHome}>
          Back to home
        </button>
      </div>
    </div>
  );
}
