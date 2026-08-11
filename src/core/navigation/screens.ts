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
  recipients: undefined;
  "transfer-destination": undefined;
  "send-mobile": undefined;
  /**
   * One review → confirm → receipt pipeline serves transfers, cash-in, bills and
   * QR. Naming these `payment-*` rather than `transfer-*` is the point: four
   * copies of each would otherwise be eight near-identical screens.
   */
  "payment-review": undefined;
  "payment-confirm": undefined;
  "payment-receipt": undefined;
  "payment-status": undefined;
  deposit: undefined;
  "fund-wallet": undefined;
<<<<<<< HEAD
  "cash-out": undefined;
=======
  "jar-move": undefined;
>>>>>>> feat/gap-07-savings-jar
  "qr-scan": undefined;
  "qr-receive": undefined;
  "bill-entry": undefined;
  "autopay-detail": undefined;
  "load-entry": undefined;
  "request-entry": undefined;
  payments: undefined;
  activity: undefined;
  "transaction-detail": undefined;
  quest: undefined;
  reward: undefined;
  profile: undefined;
  /** The account layer, reached from the Settings and Account hubs. */
  settings: undefined;
  /** Linked bank accounts management (GAP-09): add / remove / set default. */
  "bank-accounts": undefined;
  notifications: undefined;
  "security-settings": undefined;
  "account-details": undefined;
  "card-detail": undefined;
  "card-add": undefined;
  limits: undefined;
  "kyc-status": undefined;
  "kyc-capture": undefined;
  statements: undefined;
  "statement-month": undefined;
  help: undefined;
  dispute: undefined;
  "sign-in-otp": undefined;
  "forgot-password": undefined;
  /** Monthly spend breakdown, reached from Activity. */
  insights: undefined;
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
