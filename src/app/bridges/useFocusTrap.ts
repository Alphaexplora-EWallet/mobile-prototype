import { useEffect, useRef, type RefObject } from "react";

/** Selector for elements a keyboard user can reach with Tab. */
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal focus management for the web shell: moves focus into the dialog when
 * it mounts, traps Tab inside it, closes on Escape, and returns focus to the
 * element that opened it when it unmounts.
 *
 * This is a renderless browser side effect, so it lives at the web edge: React
 * Native replaces the whole overlay with a native modal and never renders this
 * hook's host.
 */
export function useFocusTrap(dialogRef: RefObject<HTMLElement | null>, onEscape: () => void): void {
  // Keep the latest escape callback without re-running the focus logic each render.
  const escapeRef = useRef(onEscape);
  useEffect(() => {
    escapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement;

    const focusables = () => dialog.querySelectorAll<HTMLElement>(FOCUSABLE);

    // Initial focus: the first control, so the dialog name and action announce.
    (focusables()[0] ?? dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        escapeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const target = event.target as HTMLElement;
      // Wrap at both ends; also pull focus back in when Tab lands outside.
      if (event.shiftKey && (target === first || !dialog.contains(target))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (target === last || !dialog.contains(target))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [dialogRef]);
}
