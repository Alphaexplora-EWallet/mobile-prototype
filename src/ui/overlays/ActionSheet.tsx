import type { SimulatedResult } from "@/core/domain/simulation";
import { Icon } from "../primitives/Icon";

export function ActionSheet({ result, onClose }: { result: SimulatedResult; onClose: () => void }) {
  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="action-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="sheet-handle" />
        <span className="sheet-icon">
          <Icon name="wallet" />
        </span>
        <h2 id="sheet-title">{result.title}</h2>
        <p>{result.body}</p>
        <button className="primary-button" type="button" onClick={onClose}>
          Got it
        </button>
      </section>
    </div>
  );
}
