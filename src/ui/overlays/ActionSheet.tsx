import { useRef } from "react";
import type { SimulatedResult } from "@/core/domain/simulation";
import { useFocusTrap } from "@/app/bridges/useFocusTrap";
import { Icon } from "../primitives/Icon";

/**
 * A modal action sheet. `aria-modal` plus real focus management: opening moves
 * focus into the dialog, Tab is trapped inside it, Escape dismisses it, and
 * focus returns to whatever opened it.
 */
export function ActionSheet({ result, onClose }: { result: SimulatedResult; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  useFocusTrap(dialogRef, onClose);

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        ref={dialogRef}
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
