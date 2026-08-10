import { Icon } from "../primitives/Icon";

export function PageBar({ title, onBack, optionsLabel }: { title: string; onBack?: () => void; optionsLabel: string }) {
  return (
    <header className="centered-app-bar page-app-bar">
      {onBack ? (
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back to home">
          <Icon name="arrow-left" />
        </button>
      ) : (
        <span className="app-bar-spacer" />
      )}
      <strong>{title}</strong>
      <button className="icon-button clear-button" type="button" aria-label={optionsLabel}>
        <Icon name="more" />
      </button>
    </header>
  );
}
