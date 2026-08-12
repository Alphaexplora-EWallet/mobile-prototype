import { useEffect, useState } from "react";
import type { DeviceSession } from "../domain/security";
import { NOTIFICATION_PREFERENCES, unreadCount, visibleNotifications } from "../domain/notification";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { activityActions } from "../stores/activity.store";
import { preferencesActions, usePreferencesStore } from "../stores/preferences.store";
import { settingsActions, useSettingsStore } from "../stores/settings.store";
import { uiActions } from "../stores/ui.store";

/**
 * App preferences, and only those.
 *
 * This screen used to be the whole account hub, because Profile offered no way
 * in and something had to. Profile now carries the account and security rows
 * directly, so what is left here is what the title actually promises: how the
 * app looks and what it shows.
 */
export function useSettingsViewModel() {
  const navigation = useNavigation();
  const theme = usePreferencesStore((state) => state.theme);
  const balanceVisible = usePreferencesStore((state) => state.balanceVisible);

  return {
    title: "Settings",
    darkMode: theme === "dark",
    setDarkMode: (enabled: boolean) => preferencesActions.setTheme(enabled ? "dark" : "light"),
    balanceVisible,
    // The store exposes a toggle, not a setter; the Toggle hands back the value
    // it wants, which for a two-state control is always the opposite of now.
    setBalanceVisible: () => preferencesActions.toggleBalanceVisibility(),
    back: navigation.goBack,
  };
}

export function useNotificationsViewModel() {
  const navigation = useNavigation();
  const all = useSettingsStore((state) => state.notifications);
  const preferences = useSettingsStore((state) => state.notificationPreferences);

  /**
   * The preferences filter the feed rather than sitting beside it. A toggle that
   * changed nothing on screen would be asking the user to take it on trust.
   */
  const notifications = visibleNotifications(all, preferences);

  return {
    title: "Notifications",
    isEmpty: notifications.length === 0,
    /** Distinguishes "nothing has happened" from "you switched it all off". */
    isFiltered: notifications.length < all.length,
    unread: unreadCount(notifications),
    preferences: NOTIFICATION_PREFERENCES.map((preference) => ({
      ...preference,
      enabled: preferences[preference.kind],
    })),
    setPreference: settingsActions.setNotificationPreference,
    items: notifications.map((notification) => ({
      id: notification.id,
      icon: notification.icon,
      title: notification.title,
      body: notification.body,
      when: notification.when,
      read: notification.read,
      /** Only payment notifications point at something to open. */
      opensTransaction: notification.transactionId !== undefined,
    })),
    markAllRead: settingsActions.markAllRead,
    open: (id: string) => {
      settingsActions.markRead(id);
      const notification = notifications.find((entry) => entry.id === id);
      if (!notification?.transactionId) return;
      activityActions.selectTransaction(notification.transactionId);
      navigation.navigate("transaction-detail");
    },
    back: navigation.goBack,
  };
}

export function useSecuritySettingsViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const biometricsEnabled = useSettingsStore((state) => state.biometricsEnabled);

  const [sessions, setSessions] = useState<readonly DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void gateway.security.sessions().then((result) => {
      if (!active) return;
      if (result.ok) setSessions(result.value);
      else setError(result.error.message);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  return {
    title: "Security",
    biometricsEnabled,
    setBiometrics: settingsActions.setBiometrics,
    /** Changing the PIN needs a screen this prototype does not ship. */
    changePin: () => uiActions.showSimulated("Change transaction PIN"),
    isLoading,
    error,
    sessions: sessions.map((session) => ({
      id: session.id,
      deviceName: session.deviceName,
      detail: `${session.location} · ${session.lastActiveLabel}`,
      current: session.current,
    })),
    revoke: async (id: string) => {
      setError(null);
      const result = await gateway.security.revokeSession(id);
      if (result.ok) setSessions(result.value);
      else setError(result.error.message);
    },
    back: navigation.goBack,
  };
}
