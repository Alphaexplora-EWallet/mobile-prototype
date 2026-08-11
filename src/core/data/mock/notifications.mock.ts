import type { AppNotification } from "../../domain/notification";

/**
 * `transactionId` values line up with `MOCK_TRANSACTIONS` so tapping a payment
 * notification opens a transaction that actually resolves.
 */
export const MOCK_NOTIFICATIONS: readonly AppNotification[] = [
  {
    id: "received-2000",
    kind: "payment",
    icon: "arrow-down",
    title: "You received ₱2,000.00",
    body: "Funds arrived in your main wallet through the NetBank rail.",
    when: "Yesterday, 11:18 AM",
    read: false,
    transactionId: "money-received",
  },
  {
    id: "quest-tracking",
    kind: "quest",
    icon: "target",
    title: "Your spending quest is live",
    body: "Keep today intentional — we will check in this evening.",
    when: "Yesterday, 9:02 AM",
    read: false,
  },
  {
    id: "new-device",
    kind: "security",
    icon: "lock",
    title: "New sign-in on this device",
    body: "If this was not you, change your password and review your sessions.",
    when: "Aug 8, 7:41 PM",
    read: true,
  },
  {
    id: "statement-july",
    kind: "system",
    icon: "receipt",
    title: "Your July statement is ready",
    body: "34 transactions. Available in Settings under Statements.",
    when: "Aug 1, 6:00 AM",
    read: true,
  },
];
