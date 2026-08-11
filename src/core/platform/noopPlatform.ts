import type { Platform } from "./ports";

const noSubscription = () => () => {};

/**
 * An inert Platform for tests and for rendering without a device. Lets a
 * ViewModel be exercised in plain Node with no jsdom and no stubbing.
 */
export const noopPlatform: Platform = {
  storage: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  },
  appearance: {
    getColorScheme: () => null,
    subscribe: noSubscription,
  },
  accessibility: {
    isReduceMotionEnabled: async () => false,
    subscribeReduceMotion: noSubscription,
  },
  appState: {
    getCurrentState: () => "active",
    subscribe: noSubscription,
  },
  scroll: {
    scrollToTop: () => {},
  },
  backGesture: {
    subscribe: noSubscription,
  },
  clipboard: {
    setString: async () => false,
  },
  statementExport: {
    saveCsv: async () => false,
  },
};
