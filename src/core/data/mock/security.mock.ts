import type { DeviceSession } from "../../domain/security";

/**
 * Fixed credentials, because a prototype nobody can get into is not a
 * prototype. Both are shown as hints on the screens that ask for them.
 */
export const MOCK_TRANSACTION_PIN = "246810";
export const MOCK_OTP_CODE = "135790";

/**
 * The MPIN that gets you into the app, as distinct from the transaction PIN that
 * releases a payment. Two different values on purpose: one credential opening
 * both doors is exactly what the split is there to prevent.
 *
 * Passes the weak-PIN rules in `domain/pin.ts`, so the sandbox hint is also a
 * legal example.
 */
export const MOCK_MPIN = "271828";

/** How many wrong MPINs the mock accepts before it makes you reset it. */
export const MPIN_ATTEMPT_LIMIT = 3;

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
