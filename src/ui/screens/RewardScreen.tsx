import { BrandMark } from "../layout/BrandMark";
import { IMAGERY } from "../assets";
import { useRewardViewModel } from "@/core/viewmodels/useOnboardingViewModel";

export function RewardScreen() {
  const { xpEarned, limitLabel, levelLabel, nextLevelLabel, levelPercent, apply, home } = useRewardViewModel();

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
        <p>You stayed within your {limitLabel} limit today.</p>
        <div className="xp-earned">
          <strong>{xpEarned}</strong>
          <b>XP</b>
          <span>earned</span>
        </div>
        <div className="level-progress">
          <span>
            <b>{levelLabel}</b>
            <b>{nextLevelLabel}</b>
          </span>
          <div className="progress-track">
            <i style={{ width: `${levelPercent}%` }} />
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
        <button className="primary-button" type="button" onClick={apply}>
          Use this card style
        </button>
        <button className="secondary-button" type="button" onClick={home}>
          Back to home
        </button>
      </div>
    </div>
  );
}
