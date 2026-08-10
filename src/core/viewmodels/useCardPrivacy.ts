import { useCallback, useEffect, useState } from "react";
import { usePlatform } from "../platform/PlatformContext";

/** How long revealed card details stay on screen before hiding themselves. */
const REVEAL_TIMEOUT_MS = 20_000;

export type CardPrivacy = {
  flipped: boolean;
  revealed: boolean;
  authOpen: boolean;
  toggleFlip(): void;
  /** Ask to reveal — opens the identity check rather than revealing outright. */
  requestReveal(): void;
  confirmReveal(): void;
  cancelReveal(): void;
  hideNumber(): void;
};

/**
 * Component-scoped ViewModel for a card's sensitive details.
 *
 * Holds the rule that full card numbers are shown only briefly, only while the
 * app is frontmost, and only after an identity check — none of which is web
 * specific, so none of it names a web API.
 */
export function useCardPrivacy(selected: boolean, onSelect: () => void): CardPrivacy {
  const { appState, backGesture } = usePlatform();
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Deselecting a card closes everything it had open. Adjusted during render
  // rather than in an effect, so there is no extra commit with stale state
  // visible in between.
  const [wasSelected, setWasSelected] = useState(selected);
  if (wasSelected !== selected) {
    setWasSelected(selected);
    if (!selected) {
      setFlipped(false);
      setRevealed(false);
      setAuthOpen(false);
    }
  }

  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => setRevealed(false), REVEAL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [revealed]);

  // Anything other than "frontmost" hides the number: a backgrounded tab, a
  // lost focus, an app switcher preview.
  useEffect(
    () =>
      appState.subscribe((status) => {
        if (status !== "active") setRevealed(false);
      }),
    [appState],
  );

  // Escape on web, hardware back on Android.
  useEffect(() => {
    if (!authOpen) return;
    return backGesture.subscribe(() => {
      setAuthOpen(false);
      return true;
    });
  }, [authOpen, backGesture]);

  const toggleFlip = useCallback(() => {
    if (!selected) onSelect();
    setFlipped((value) => {
      if (value) {
        setRevealed(false);
        setAuthOpen(false);
      }
      return !value;
    });
  }, [selected, onSelect]);

  return {
    flipped,
    revealed,
    authOpen,
    toggleFlip,
    requestReveal: useCallback(() => setAuthOpen(true), []),
    confirmReveal: useCallback(() => {
      setAuthOpen(false);
      setRevealed(true);
    }, []),
    cancelReveal: useCallback(() => setAuthOpen(false), []),
    hideNumber: useCallback(() => setRevealed(false), []),
  };
}
