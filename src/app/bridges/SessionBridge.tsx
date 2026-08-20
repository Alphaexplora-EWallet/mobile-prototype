import { useEffect } from "react";
import { usePlatform } from "@/core/platform/PlatformContext";
import { useBankingGateway } from "@/core/platform/BankingGatewayContext";
import type { AuthSession, SessionStatus, SessionToken } from "@/core/domain/session";

export const SESSION_STORAGE_KEY = "fina-session";

/**
 * Web-only side effects for the session. Renders nothing.
 *
 * The same shape as `ThemeBridge`, for the same reason: stores hold no
 * persistence middleware, so the one place that may touch storage is a bridge
 * at the web edge. React Native replaces this file and nothing else.
 *
 * **Only the token is ever written.** Not the MPIN, not the profile — a token
 * the gateway can refuse is the whole of what survives a reload, so a stolen
 * one expires and a stolen MPIN does not exist to steal.
 *
 * Storage is async, so the first render genuinely cannot know whether anyone is
 * signed in. That is what `status: "unknown"` is, and the shell shows a splash
 * for it rather than flashing a screen it may have to take back.
 */
export function SessionBridge({
  status,
  token,
  onHydrated,
}: {
  status: SessionStatus;
  token: SessionToken | null;
  onHydrated: (session: AuthSession | null) => void;
}) {
  const { storage } = usePlatform();
  const gateway = useBankingGateway();

  useEffect(() => {
    /**
     * A status that is already settled was set synchronously — a test seeding a
     * signed-in session, or a sign-out that has just happened. Asking storage
     * again would overwrite it with a stale answer.
     */
    if (status !== "unknown") return;
    let cancelled = false;
    void storage.getItem(SESSION_STORAGE_KEY).then(async (saved) => {
      if (cancelled) return;
      if (!saved) {
        onHydrated(null);
        return;
      }
      // The gateway decides whether a stored token is still a session. An
      // expired or unknown one hydrates to signed-out, same as none at all.
      const result = await gateway.auth.resume(saved);
      if (cancelled) return;
      onHydrated(result.ok ? result.value : null);
    });
    return () => {
      cancelled = true;
    };
  }, [status, storage, gateway, onHydrated]);

  useEffect(() => {
    if (status === "unknown") return;
    if (status === "signed-in" && token) void storage.setItem(SESSION_STORAGE_KEY, token);
    else void storage.removeItem(SESSION_STORAGE_KEY);
  }, [status, token, storage]);

  return null;
}
