import type { IconName } from "./icons";

export type NotificationKind = "payment" | "security" | "quest" | "system";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  icon: IconName;
  title: string;
  body: string;
  /** Display string, consistent with `Transaction.when`. */
  when: string;
  read: boolean;
  /** Set when opening this notification should show a transaction. */
  transactionId?: string;
};

/**
 * `system` is missing on purpose. Service messages — an outage, a forced
 * update, a change of terms — are not a preference; an app that lets you switch
 * them off has to keep sending them anyway, which makes the toggle a lie.
 */
export type OptionalNotificationKind = Exclude<NotificationKind, "system">;

export type NotificationPreferences = Readonly<Record<OptionalNotificationKind, boolean>>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  payment: true,
  security: true,
  quest: true,
};

export type NotificationPreferenceInfo = {
  kind: OptionalNotificationKind;
  icon: IconName;
  title: string;
  detail: string;
};

export const NOTIFICATION_PREFERENCES: readonly NotificationPreferenceInfo[] = [
  { kind: "payment", icon: "send", title: "Payments", detail: "Money sent, received, and settled" },
  { kind: "security", icon: "lock", title: "Security", detail: "Sign-ins, new devices, and PIN changes" },
  { kind: "quest", icon: "target", title: "Quests", detail: "Progress, streaks, and rewards" },
];

/** Filters a feed to what the user asked to see. System messages always pass. */
export const visibleNotifications = (
  notifications: readonly AppNotification[],
  preferences: NotificationPreferences,
): readonly AppNotification[] =>
  notifications.filter((notification) => notification.kind === "system" || preferences[notification.kind]);

export const unreadCount = (notifications: readonly AppNotification[]): number =>
  notifications.reduce((total, notification) => (notification.read ? total : total + 1), 0);
