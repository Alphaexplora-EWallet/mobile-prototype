import { create } from "zustand";
import type { UserProfile } from "../domain/user";
import { MOCK_USER } from "../data/mock/user.mock";

export const INITIAL_USER: UserProfile = MOCK_USER;

type UserState = UserProfile & {
  actions: {
    setFullName(fullName: string): void;
    setMobile(mobile: string): void;
    setEmail(email: string): void;
  };
};

/**
 * The signed-in user's own details. Editable because Personal details edits
 * them; changing a mobile or email steps up through OTP first, which is the
 * ViewModel's job — this store only records the outcome.
 */
export const useUserStore = create<UserState>()((set, get) => ({
  ...INITIAL_USER,
  actions: {
    setFullName: (fullName) => {
      if (get().fullName === fullName) return;
      set({ fullName });
    },
    setMobile: (mobile) => {
      if (get().mobile === mobile) return;
      set({ mobile });
    },
    setEmail: (email) => {
      if (get().email === email) return;
      set({ email });
    },
  },
}));

export const userActions = useUserStore.getState().actions;
