import { create } from "zustand";
import type { ConfirmationToken } from "../domain/security";
import type { AuthIntent, AuthSession, SessionStatus, SessionToken } from "../domain/session";
import { userActions } from "./user.store";

/**
 * Whether anyone is signed in, and the half-finished registration if not.
 *
 * The registration draft lives here rather than in route params for the reason
 * `screens.ts` gives: flow state has to survive leaving the screen, and route
 * params in this stack are deliberately empty. It is also why the set-MPIN and
 * one-time-code screens can serve both sign-up and MPIN reset — `intent` says
 * which, so two near-identical screens are not needed.
 *
 * The MPIN is never held here. It goes straight from the field to the gateway
 * and is forgotten; only the opaque token comes back.
 */
export const INITIAL_SESSION = {
  status: "unknown" as SessionStatus,
  token: null as SessionToken | null,
  deviceName: null as string | null,
  /** The number being registered or recovered, in national form. */
  mobile: "",
  /** Collected before the MPIN step, submitted with it. */
  fullName: "",
  /**
   * The proof that the one-time code came back, spent by whichever call ends the
   * flow. Opaque and single-use, so it survives a screen the way the MPIN must
   * not: the worst a stale one can do is fail.
   */
  confirmation: null as ConfirmationToken | null,
  intent: null as AuthIntent | null,
};

type SessionState = typeof INITIAL_SESSION & {
  actions: {
    /**
     * The answer to "was a session stored?", which only the bridge can ask
     * because only it may touch storage. `null` means no, or a token the
     * gateway refused.
     */
    hydrated(session: AuthSession | null): void;
    signedIn(session: AuthSession): void;
    signedOut(): void;
    setMobile(mobile: string): void;
    setFullName(fullName: string): void;
    setConfirmation(confirmation: ConfirmationToken): void;
    setIntent(intent: AuthIntent | null): void;
  };
};

export const useSessionStore = create<SessionState>()((set, get) => ({
  ...INITIAL_SESSION,
  actions: {
    hydrated: (session) => {
      if (get().status !== "unknown") return;
      if (session) get().actions.signedIn(session);
      else set({ status: "signed-out" });
    },
    signedIn: (session) => {
      set({
        status: "signed-in",
        token: session.token,
        deviceName: session.deviceName,
        // The draft has done its job; leaving it would show a stale number on
        // the next sign-up.
        mobile: "",
        fullName: "",
        confirmation: null,
        intent: null,
      });
      /**
       * The account the gateway just confirmed is the account Profile shows.
       * Writing it here rather than in the ViewModel means every route into a
       * session — sign-up, sign-in, MPIN reset, a restored token — agrees.
       */
      userActions.setFullName(session.user.fullName);
      userActions.setMobile(session.user.mobile);
      userActions.setEmail(session.user.email);
    },
    signedOut: () => set({ ...INITIAL_SESSION, status: "signed-out" }),
    setMobile: (mobile) => {
      if (get().mobile === mobile) return;
      set({ mobile });
    },
    setFullName: (fullName) => {
      if (get().fullName === fullName) return;
      set({ fullName });
    },
    setConfirmation: (confirmation) => set({ confirmation }),
    setIntent: (intent) => {
      if (get().intent === intent) return;
      set({ intent });
    },
  },
}));

export const sessionActions = useSessionStore.getState().actions;
