import type { DeviceSession } from "../../domain/security";

/**
 * Fixed credentials, because a prototype nobody can get into is not a
 * prototype. Both are shown as hints on the screens that ask for them.
 */
export const MOCK_TRANSACTION_PIN = "246810";
export const MOCK_OTP_CODE = "135790";

export const MOCK_OTP_DESTINATION = "0917 ••• 2288";

export const MOCK_SESSIONS: readonly DeviceSession[] = [
  {
    id: "this-device",
    deviceName: "iPhone 15 · FIN-A app",
    location: "Quezon City, PH",
    lastActiveLabel: "Active now",
    current: true,
  },
  {
    id: "chrome-macos",
    deviceName: "Chrome on macOS",
    location: "Makati, PH",
    lastActiveLabel: "Aug 8, 7:41 PM",
    current: false,
  },
];
