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
  /** Registration step 1: the mobile number that becomes the account key. */
  "sign-up": undefined;
  /** Registration step 2: the name on the account. */
  "sign-up-profile": undefined;
  /**
   * Sets the MPIN, and is the step that actually creates the account. Also the
   * last step of an MPIN reset — `session.intent` says which, so one screen
   * serves both instead of two that differ by a submit call.
   */
  "sign-up-pin": undefined;
  /**
   * The one-time-code step, shared by registration and MPIN reset for the same
   * reason the `payment-*` pipeline is shared: two copies would differ only in
   * their copy.
   */
  "auth-otp": undefined;
  /** MPIN recovery, entered from sign-in. */
  "forgot-pin": undefined;
  /** The KYC nudge a new account lands on, offering the capture flow or Home. */
  "verify-identity": undefined;
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
  "cash-out": undefined;
  "jar-move": undefined;
  "qr-scan": undefined;
  "qr-receive": undefined;
  "bill-entry": undefined;
  "autopay-detail": undefined;
  "load-entry": undefined;
  payments: undefined;
  activity: undefined;
  "transaction-detail": undefined;
  quest: undefined;
  reward: undefined;
  profile: undefined;
  /** Name, mobile and email — the user's own details, edited behind an OTP. */
  "personal-details": undefined;
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
  /** Monthly spend breakdown, reached from Activity. */
  insights: undefined;
};

export type Screen = keyof ScreenParams;

export type TabScreen = Extract<Screen, "home" | "wallet" | "activity" | "quest" | "profile">;

export type TabItem = {
  id: TabScreen;
  label: string;
  icon: IconName;
};

/**
 * Single source of truth for the tab bar. Previously the tab list and the
 * "should the tab bar show?" check were two separate literals that had to be
 * kept in agreement by hand.
 *
 * The third slot was Pay, a menu of five actions that Home's quick actions
 * already offered — a permanent tab spent on a duplicate. Activity has it now:
 * money already spent is the thing a wallet gets asked about most and it had no
 * home of its own, reachable only through Home's "See all".
 */
export const TAB_ITEMS: readonly TabItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "wallet", label: "Wallet", icon: "wallet" },
  { id: "activity", label: "Activity", icon: "receipt" },
  { id: "quest", label: "Quests", icon: "target" },
  { id: "profile", label: "Profile", icon: "user" },
];

export const TAB_SCREENS: readonly TabScreen[] = TAB_ITEMS.map((item) => item.id);

export const isTabScreen = (screen: Screen): screen is TabScreen => (TAB_SCREENS as readonly Screen[]).includes(screen);

/**
 * The screens reachable without a session — and, read the other way, the ones a
 * signed-in user is redirected away from. The shell derives which stack to show
 * from this rather than each screen checking for itself, because a check every
 * screen has to remember is a check one screen will forget.
 *
 * `verify-identity` is deliberately absent: it comes *after* the account exists.
 */
export const AUTH_SCREENS: readonly Screen[] = [
  "welcome",
  "sign-in",
  "sign-up",
  "sign-up-profile",
  "sign-up-pin",
  "auth-otp",
  "forgot-pin",
];

export const isAuthScreen = (screen: Screen): boolean => AUTH_SCREENS.includes(screen);

export const INITIAL_SCREEN: Screen = "welcome";

/** Where a session lands when it starts, and where the gate sends a stray. */
export const SIGNED_IN_SCREEN: Screen = "home";
