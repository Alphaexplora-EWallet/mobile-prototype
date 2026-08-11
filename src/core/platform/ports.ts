/**
 * The seam between this app's logic and the device it runs on.
 *
 * Method names deliberately mirror React Native's APIs rather than the DOM's,
 * so the adapter that ends up doing the awkward translation is the one that is
 * temporary (web) and the native adapter is a thin passthrough.
 *
 * Every port is async or push-based, including ones the web could answer
 * synchronously. AsyncStorage and AccessibilityInfo.isReduceMotionEnabled are
 * async on device; forcing that shape now means the React Native port
 * discovers no new asynchrony later.
 */

export type Unsubscribe = () => void;

export type ColorScheme = "light" | "dark";

export interface StoragePort {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** System light/dark preference. RN: Appearance. */
export interface AppearancePort {
  getColorScheme(): ColorScheme | null;
  subscribe(listener: (scheme: ColorScheme | null) => void): Unsubscribe;
}

/** RN: AccessibilityInfo. */
export interface AccessibilityPort {
  isReduceMotionEnabled(): Promise<boolean>;
  subscribeReduceMotion(listener: (enabled: boolean) => void): Unsubscribe;
}

/**
 * Whether the app is frontmost. Drives hiding revealed card details when the
 * user looks away. RN: AppState.
 */
export type AppStateStatus = "active" | "inactive" | "background";

export interface AppStatePort {
  getCurrentState(): AppStateStatus;
  subscribe(listener: (status: AppStateStatus) => void): Unsubscribe;
}

/** RN: a ScrollView ref, or nothing at all since navigation resets scroll. */
export interface ScrollPort {
  scrollToTop(options?: { animated?: boolean }): void;
}

/** Escape on web, the hardware back button on Android. Return true to consume. */
export interface BackGesturePort {
  subscribe(handler: () => boolean): Unsubscribe;
}

/**
 * RN: Clipboard.setString. Async because the web's `navigator.clipboard` is,
 * and because it can be refused — copying an account number is the one action on
 * the funding screen that has to actually work, so the caller needs to know.
 */
export interface ClipboardPort {
  setString(value: string): Promise<boolean>;
}

/**
 * Saves a client-generated artifact (statement CSV today). Web: an `<a download>`
 * click that hands the bytes to the browser. RN: the share/save sheet. Async
 * and result-bearing because a native save sheet can be cancelled or refused.
 */
export interface StatementExportPort {
  saveCsv(filename: string, content: string): Promise<boolean>;
}

export interface Platform {
  readonly storage: StoragePort;
  readonly appearance: AppearancePort;
  readonly accessibility: AccessibilityPort;
  readonly appState: AppStatePort;
  readonly scroll: ScrollPort;
  readonly backGesture: BackGesturePort;
  readonly clipboard: ClipboardPort;
  readonly statementExport: StatementExportPort;
}
