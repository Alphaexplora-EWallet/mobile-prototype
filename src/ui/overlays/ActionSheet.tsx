import { useRef } from "react";
import type { SheetResult } from "@/core/domain/simulation";
import { useFocusTrap } from "@/app/bridges/useFocusTrap";
import { Icon } from "../primitives/Icon";

/**
 * A modal action sheet. `aria-modal` plus real focus management: opening moves
 * focus into the dialog, Tab is trapped inside it, Escape dismisses it, and
 * focus returns to whatever opened it.
 *
 * Two shapes, one dialog. A `simulated` result announces something and needs
 * only an acknowledgement; a `confirm` request asks a question, so it offers a
 * way out as well as a way through. Escape, the backdrop and Cancel all mean
 * "no" — a confirm is never satisfied by dismissal.
 */
export function ActionSheet({
  result,
  onClose,
  onConfirm,
}: {
  result: SheetResult;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useFocusTrap(dialogRef, onClose);

  const isConfirm = result.kind === "confirm";

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
          <Icon name={isConfirm ? "lock" : "wallet"} />
        </span>
        <h2 id="sheet-title">{result.title}</h2>
        <p>{result.body}</p>
        {isConfirm ? (
          <div className="sheet-actions">
            <button className="primary-button is-destructive" type="button" onClick={onConfirm}>
              {result.confirmLabel}
            </button>
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="primary-button" type="button" onClick={onClose}>
            Got it
          </button>
        )}
      </section>
    </div>
  );
}
