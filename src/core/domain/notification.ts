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

export const unreadCount = (notifications: readonly AppNotification[]): number =>
  notifications.reduce((total, notification) => (notification.read ? total : total + 1), 0);
