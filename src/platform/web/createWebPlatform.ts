import type {
  AccessibilityPort,
  AppearancePort,
  AppStatePort,
  AppStateStatus,
  BackGesturePort,
  ClipboardPort,
  ColorScheme,
  Platform,
  ScrollPort,
  StatementExportPort,
  StoragePort,
} from "@/core/platform/ports";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const REDUCE_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** localStorage is synchronous; the port is async because AsyncStorage is. */
function createWebStorage(): StoragePort {
  return {
    async getItem(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null; // private browsing, disabled storage, quota
      }
    },
    async setItem(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* persistence is best-effort */
      }
    },
    async removeItem(key) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

function subscribeToQuery(query: string, listener: (matches: boolean) => void) {
  const list = window.matchMedia(query);
  const handle = (event: MediaQueryListEvent) => listener(event.matches);
  list.addEventListener("change", handle);
  return () => list.removeEventListener("change", handle);
}

function createWebAppearance(): AppearancePort {
  return {
    getColorScheme: (): ColorScheme | null => (window.matchMedia(DARK_QUERY).matches ? "dark" : "light"),
    subscribe: (listener) => subscribeToQuery(DARK_QUERY, (matches) => listener(matches ? "dark" : "light")),
  };
}

function createWebAccessibility(): AccessibilityPort {
  return {
    isReduceMotionEnabled: async () => window.matchMedia(REDUCE_MOTION_QUERY).matches,
    subscribeReduceMotion: (listener) => subscribeToQuery(REDUCE_MOTION_QUERY, listener),
  };
}

/**
 * Collapses visibility and focus into React Native's three-state AppState.
 * A blurred-but-visible window is "inactive"; a hidden tab is "background".
 */
function createWebAppState(): AppStatePort {
  const read = (): AppStateStatus => {
    if (document.hidden) return "background";
    return document.hasFocus() ? "active" : "inactive";
  };
  return {
    getCurrentState: read,
    subscribe(listener) {
      const emit = () => listener(read());
      document.addEventListener("visibilitychange", emit);
      window.addEventListener("blur", emit);
      window.addEventListener("focus", emit);
      return () => {
        document.removeEventListener("visibilitychange", emit);
        window.removeEventListener("blur", emit);
        window.removeEventListener("focus", emit);
      };
    },
  };
}

function createWebScroll(): ScrollPort {
  return {
    scrollToTop: ({ animated = true } = {}) => window.scrollTo({ top: 0, behavior: animated ? "smooth" : "auto" }),
  };
}

/** Escape stands in for Android's hardware back button. */
function createWebBackGesture(): BackGesturePort {
  return {
    subscribe(handler) {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") handler();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    },
  };
}

/**
 * `navigator.clipboard` is absent over plain HTTP and can be refused outright,
 * so this reports whether the copy actually happened rather than assuming it.
 */
function createWebClipboard(): ClipboardPort {
  return {
    async setString(value) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        return false;
      }
    },
  };
}

/**
 * Hands the CSV bytes to the browser through a temporary download anchor. The
 * object URL is revoked on the next tick so repeated exports do not leak blob
 * handles. `URL.createObjectURL` is missing in jsdom and can be missing in
 * embedded webviews, so absence reports failure instead of throwing.
 */
function createWebStatementExport(): StatementExportPort {
  return {
    async saveCsv(filename, content) {
      if (typeof URL.createObjectURL !== "function") return false;
      const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      return true;
    },
  };
}

export function createWebPlatform(): Platform {
  return {
    storage: createWebStorage(),
    appearance: createWebAppearance(),
    accessibility: createWebAccessibility(),
    appState: createWebAppState(),
    scroll: createWebScroll(),
    backGesture: createWebBackGesture(),
    clipboard: createWebClipboard(),
    statementExport: createWebStatementExport(),
  };
}
