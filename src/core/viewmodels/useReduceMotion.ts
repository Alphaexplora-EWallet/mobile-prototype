import { useEffect, useState } from "react";
import { usePlatform } from "../platform/PlatformContext";

/**
 * Whether the user asked for reduced motion.
 *
 * Read once on mount and then kept current by subscription, rather than
 * queried at the moment of an interaction. React Native answers this
 * asynchronously (AccessibilityInfo.isReduceMotionEnabled), and a press
 * handler cannot await, so the value has to already be in hand.
 */
export function useReduceMotion(): boolean {
  const { accessibility } = usePlatform();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void accessibility.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const unsubscribe = accessibility.subscribeReduceMotion(setReduceMotion);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [accessibility]);

  return reduceMotion;
}
