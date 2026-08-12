import { create } from "zustand";
import type { AppNotification, NotificationPreferences, OptionalNotificationKind } from "../domain/notification";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../domain/notification";
import { MOCK_NOTIFICATIONS } from "../data/mock/notifications.mock";

export const INITIAL_SETTINGS = {
  notifications: MOCK_NOTIFICATIONS as readonly AppNotification[],
  /** What the user wants to hear about. `system` is not among them — see the domain. */
  notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES as NotificationPreferences,
  biometricsEnabled: true,
  /** Which help topic is expanded, if any. */
  openHelpTopic: null as string | null,
};

type SettingsState = typeof INITIAL_SETTINGS & {
  actions: {
    markRead(id: string): void;
    markAllRead(): void;
    setNotificationPreference(kind: OptionalNotificationKind, enabled: boolean): void;
    setBiometrics(enabled: boolean): void;
    toggleHelpTopic(id: string): void;
  };
};

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...INITIAL_SETTINGS,
  actions: {
    markRead: (id) => {
      if (get().notifications.find((entry) => entry.id === id)?.read !== false) return;
      set((state) => ({
        notifications: state.notifications.map((entry) => (entry.id === id ? { ...entry, read: true } : entry)),
      }));
    },
    markAllRead: () => {
      if (get().notifications.every((entry) => entry.read)) return;
      set((state) => ({ notifications: state.notifications.map((entry) => ({ ...entry, read: true })) }));
    },
    setNotificationPreference: (kind, enabled) => {
      if (get().notificationPreferences[kind] === enabled) return;
      set((state) => ({ notificationPreferences: { ...state.notificationPreferences, [kind]: enabled } }));
    },
    setBiometrics: (biometricsEnabled) => set({ biometricsEnabled }),
    toggleHelpTopic: (id) => set((state) => ({ openHelpTopic: state.openHelpTopic === id ? null : id })),
  },
}));

export const settingsActions = useSettingsStore.getState().actions;
