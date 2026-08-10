import { useEffect, useLayoutEffect, useState } from "react";
import { usePlatform } from "@/core/platform/PlatformContext";
import type { Theme } from "@/ui/theme/ThemeContext";

export const THEME_STORAGE_KEY = "fina-theme";

/**
 * Web-only side effects for theming. Renders nothing.
 *
 * Storage is async here because it is async on device, which means the theme
 * cannot be known during the first render. The inline script in index.html
 * paints the correct theme before React starts, and this bridge deliberately
 * does not write to the DOM until hydration finishes so it cannot overwrite
 * that with a default.
 *
 * React Native replaces this file entirely: no documentElement, no
 * colorScheme, just the stored value feeding a StyleSheet theme.
 */
export function ThemeBridge({ theme, onThemeChange }: { theme: Theme; onThemeChange: (theme: Theme) => void }) {
  const { storage, appearance } = usePlatform();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void storage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (cancelled) return;
      onThemeChange(saved === "light" || saved === "dark" ? saved : (appearance.getColorScheme() ?? "light"));
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [storage, appearance, onThemeChange]);

  useLayoutEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    void storage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, hydrated, storage]);

  return null;
}
