import { MOCK_CARDHOLDER } from "@/core/data/mock/cards.mock";
import { Icon } from "../primitives/Icon";

export function ProfileScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="tab-page profile-page">
      <header className="centered-app-bar page-app-bar">
        <span />
        <strong>Profile</strong>
        <button className="icon-button clear-button" type="button" aria-label="Profile options">
          <Icon name="more" />
        </button>
      </header>
      <section className="profile-hero">
        <span className="profile-avatar">
          <Icon name="user" />
        </span>
        <h1>{MOCK_CARDHOLDER.name}</h1>
        <p>The Free Spirit · Level 3</p>
        <div className="profile-level">
          <span style={{ width: "75%" }} />
        </div>
      </section>
      <section className="profile-section">
        <h2>Your money style</h2>
        <p>You value freedom, experiences, and generosity. Your plan focuses on spending with intention.</p>
      </section>
      <section className="profile-section">
        <h2>Prototype controls</h2>
        <button className="secondary-button" type="button" onClick={onRestart}>
          Retake money style quiz
        </button>
      </section>
    </div>
  );
}
