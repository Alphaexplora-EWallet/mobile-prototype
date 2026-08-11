import { useEffect, useState } from "react";
import type { DeviceSession } from "../domain/security";
import { unreadCount } from "../domain/notification";
import type { Screen } from "../navigation/screens";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { activityActions } from "../stores/activity.store";
import { preferencesActions, usePreferencesStore } from "../stores/preferences.store";
import { settingsActions, useSettingsStore } from "../stores/settings.store";
import { uiActions } from "../stores/ui.store";

export type SettingsRow = { id: string; icon: string; title: string; detail: string; meta?: string };

/**
 * The hub the app never had. Theme lived as a one-off toggle on Home and there
 * was nowhere at all to reach verification, limits, statements or sessions.
 */
export function useSettingsViewModel() {
  const navigation = useNavigation();
  const theme = usePreferencesStore((state) => state.theme);
  const balanceVisible = usePreferencesStore((state) => state.balanceVisible);
  const notifications = useSettingsStore((state) => state.notifications);
  const unread = unreadCount(notifications);

  const go = (screen: Screen) => () => navigation.navigate(screen);

  return {
    title: "Settings",
    unreadLabel: unread > 0 ? String(unread) : undefined,
    darkMode: theme === "dark",
    setDarkMode: (enabled: boolean) => preferencesActions.setTheme(enabled ? "dark" : "light"),
    balanceVisible,
    // The store exposes a toggle, not a setter; the Toggle hands back the value
    // it wants, which for a two-state control is always the opposite of now.
    setBalanceVisible: () => preferencesActions.toggleBalanceVisibility(),
    accountRows: [
      { id: "account-details", icon: "bank", title: "Account details", detail: "Number, status, and funding" },
      { id: "bank-accounts", icon: "bank", title: "Linked accounts", detail: "Bank accounts you can send from" },
      { id: "limits", icon: "limit", title: "Limits and fees", detail: "What each rail costs and allows" },
      { id: "kyc-status", icon: "user", title: "Verification", detail: "Your tier and what it unlocks" },
      { id: "statements", icon: "receipt", title: "Statements", detail: "Monthly summaries to download" },
    ],
    appRows: [
      { id: "notifications", icon: "mail", title: "Notifications", detail: "Payments, security, and quests" },
      { id: "security-settings", icon: "lock", title: "Security", detail: "PIN, biometrics, and devices" },
      { id: "help", icon: "heart", title: "Help and disputes", detail: "Common questions and how to dispute" },
    ],
    open: (id: string) => navigation.navigate(id as Screen),
    openNotifications: go("notifications"),
    back: navigation.goBack,
  };
}

export function useNotificationsViewModel() {
  const navigation = useNavigation();
  const notifications = useSettingsStore((state) => state.notifications);

  return {
    title: "Notifications",
    isEmpty: notifications.length === 0,
    unread: unreadCount(notifications),
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
