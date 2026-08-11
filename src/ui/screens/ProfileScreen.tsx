import { Icon } from "../primitives/Icon";
import { useProfileViewModel } from "@/core/viewmodels/useOnboardingViewModel";

export function ProfileScreen() {
  const { name, retakeQuiz, openSettings } = useProfileViewModel();

  return (
    <div className="tab-page profile-page">
      <header className="centered-app-bar page-app-bar">
        <span />
        <strong>Profile</strong>
        {/* Was decorative with no handler; the settings hub hangs off it. */}
        <button className="icon-button clear-button" type="button" aria-label="Profile options" onClick={openSettings}>
          <Icon name="more" />
        </button>
      </header>
      <section className="profile-hero">
        <span className="profile-avatar">
          <Icon name="user" />
        </span>
        <h1>{name}</h1>
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
        <button className="secondary-button" type="button" onClick={retakeQuiz}>
          Retake money style quiz
        </button>
      </section>
    </div>
  );
}
