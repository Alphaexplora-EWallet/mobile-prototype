import type { IconName } from "../domain/icons";

/**
 * The screen map. Shaped like a React Navigation param list so that swapping
 * the hand-rolled stack for React Navigation later is a change of
 * implementation, not of vocabulary.
 *
 * Params are deliberately sparse: flow state (such as the quest's limit-setup
 * step) belongs in a store, not in a route, because it must survive a tab
 * switch and be resumable.
 */
export type ScreenParams = {
  welcome: undefined;
  "sign-in": undefined;
  quiz: undefined;
  result: undefined;
  home: undefined;
  wallet: undefined;
  transfer: undefined;
  deposit: undefined;
  payments: undefined;
  quest: undefined;
  reward: undefined;
  profile: undefined;
};

export type Screen = keyof ScreenParams;

export type TabScreen = Extract<Screen, "home" | "wallet" | "payments" | "quest" | "profile">;

export type TabItem = {
  id: TabScreen;
  label: string;
  icon: IconName;
};

/**
 * Single source of truth for the tab bar. Previously the tab list and the
 * "should the tab bar show?" check were two separate literals that had to be
 * kept in agreement by hand.
 */
export const TAB_ITEMS: readonly TabItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "wallet", label: "Wallet", icon: "wallet" },
  { id: "payments", label: "Pay", icon: "qr" },
  { id: "quest", label: "Quests", icon: "target" },
  { id: "profile", label: "Profile", icon: "user" },
];

export const TAB_SCREENS: readonly TabScreen[] = TAB_ITEMS.map((item) => item.id);

export const isTabScreen = (screen: Screen): screen is TabScreen => (TAB_SCREENS as readonly Screen[]).includes(screen);

export const INITIAL_SCREEN: Screen = "welcome";
