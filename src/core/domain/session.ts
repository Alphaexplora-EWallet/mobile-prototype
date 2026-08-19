import type { UserProfile } from "./user";

/**
 * What it means to be signed in.
 *
 * The prototype previously had no answer: "signed in" was whichever screen the
 * navigation stack happened to be rooted on, which meant a reload signed you
 * out and nothing could tell an authenticated screen from an anonymous one.
 *
 * The token is opaque on purpose. Only the adapter knows how to check it, the
 * same contract `ConfirmationToken` already has — and it is the only part of
 * the session that is ever persisted. The MPIN is never stored anywhere.
 */
export type SessionToken = string;

export type AuthSession = {
  token: SessionToken;
  user: UserProfile;
  /** Shown in Security settings' device list, and by `security.sessions()`. */
  deviceName: string;
};

/**
 * `"unknown"` is not a placeholder — it is the honest answer during the first
 * render. `StoragePort` is async because `AsyncStorage` is async on device, so
 * whether a session exists genuinely cannot be known synchronously. The shell
 * shows a splash rather than guessing and flashing the wrong screen.
 */
export type SessionStatus = "unknown" | "signed-out" | "signed-in";

/** Which flow the shared OTP and set-MPIN screens are serving. */
export type AuthIntent = "sign-up" | "reset-pin";
