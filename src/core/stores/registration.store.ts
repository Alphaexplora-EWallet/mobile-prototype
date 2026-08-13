import { create } from "zustand";

/**
 * The in-progress sign-up, carried across the mobile → OTP → details → PIN
 * screens. Routes carry no params in this app (`navigation/screens.ts`), so
 * flow state that must survive a `navigate()` lives in a store — same rule as
 * the quest's limit-setup step.
 *
 * Only what the screens need to hand each other lives here. The transaction
 * PIN deliberately does not: it is typed once, handed to `security.setPin`,
 * and never stored (the gateway owns credentials, mirroring
 * `identity.users.pin_hash`).
 */
export type RegistrationDraft = {
  /** National-format digits, e.g. "09175552288" — the `identity.users.mobile` key. */
  mobile: string;
  fullName: string;
  /** Optional, matching `identity.users.email` being nullable. */
  email: string;
};

export const INITIAL_REGISTRATION: RegistrationDraft = {
  mobile: "",
  fullName: "",
  email: "",
};

type RegistrationState = RegistrationDraft & {
  actions: {
    setMobile(mobile: string): void;
    setFullName(fullName: string): void;
    setEmail(email: string): void;
    /** Clears the draft once the account exists, so it never lingers into a future flow. */
    reset(): void;
  };
};

export const useRegistrationStore = create<RegistrationState>()((set, get) => ({
  ...INITIAL_REGISTRATION,
  actions: {
    setMobile: (mobile) => {
      if (get().mobile === mobile) return;
      set({ mobile });
    },
    setFullName: (fullName) => {
      if (get().fullName === fullName) return;
      set({ fullName });
    },
    setEmail: (email) => {
      if (get().email === email) return;
      set({ email });
    },
    reset: () => set({ ...INITIAL_REGISTRATION }),
  },
}));

export const registrationActions = useRegistrationStore.getState().actions;
