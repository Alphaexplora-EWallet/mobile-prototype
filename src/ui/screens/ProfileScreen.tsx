import { useProfileViewModel } from "@/core/viewmodels/useProfileViewModel";
import { ControlRow } from "../primitives/ControlRow";
import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";
import { Toggle } from "../primitives/Toggle";

export function ProfileScreen() {
  const {
    title,
    name,
    styleLine,
    styleBlurb,
    levelPercent,
    levelLabel,
    verificationBadge,
    sections,
    preferences,
    open,
    retakeQuiz,
    signOut,
  } = useProfileViewModel();

  return (
    <div className="tab-page profile-page">
      <header className="centered-app-bar page-app-bar">
        <span />
        <strong>{title}</strong>
        <span />
      </header>

      <section className="profile-hero">
        <span className="profile-avatar">
          <Icon name="user" />
        </span>
        <h1>{name}</h1>
        <p>{styleLine}</p>
        {verificationBadge && (
          <span className="profile-badge">
            <Icon name="shield" />
            {verificationBadge}
          </span>
        )}
        {/* The bar is decorative; the percentage it encodes is read out beside it. */}
        <div className="profile-level" aria-hidden="true">
          <span style={{ width: `${levelPercent}%` }} />
        </div>
        <small className="profile-level-label">{levelLabel}</small>
      </section>

      <section className="profile-section">
        <h2>Your money style</h2>
        <p>{styleBlurb}</p>
        <button className="text-button" type="button" onClick={retakeQuiz}>
          Retake the quiz
        </button>
      </section>

      {sections.map((section) => (
        <section className="money-field" key={section.id}>
          <span className="field-label">{section.label}</span>
          <div className="control-list">
            {section.rows.map((row) => (
              <LinkRow
                key={row.id}
                icon={row.icon}
                title={row.title}
                detail={row.detail}
                meta={row.meta}
                onClick={() => open(row.id)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Two switches, inline. They used to be a whole screen behind a row that
          already named them, so the tap only ever bought a page transition. */}
      <section className="money-field">
        <span className="field-label">Preferences</span>
        <div className="control-list">
          <ControlRow
            icon="contrast"
            title="Dark mode"
            detail="Follows your choice, not the system"
            trailing={<Toggle checked={preferences.darkMode} onChange={preferences.setDarkMode} label="Dark mode" />}
          />
          <ControlRow
            icon="eye"
            title="Show balances"
            detail="Hide amounts on the home screen"
            trailing={
              <Toggle
                checked={preferences.balanceVisible}
                onChange={preferences.setBalanceVisible}
                label="Show balances"
              />
            }
          />
        </div>
      </section>

      <section className="profile-signout">
        <button className="secondary-button is-destructive" type="button" onClick={signOut}>
          <Icon name="log-out" />
          Sign out
        </button>
      </section>
    </div>
  );
}
