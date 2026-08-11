/**
 * Names of the icons the app draws. The actual paths live in the view layer
 * (ui/primitives/iconPaths.tsx) because they are SVG markup; only the names
 * are domain vocabulary, so only the names belong here.
 */
export type IconName =
  | "arrow-down"
  | "arrow-left"
  | "bank"
  | "bolt"
  | "card"
  | "check"
  | "chevron-right"
  | "clock"
  | "contrast"
  | "eye"
  | "eye-off"
  | "globe"
  | "heart"
  | "home"
  | "limit"
  | "lock"
  | "mail"
  | "more"
  | "plus"
  | "qr"
  | "receipt"
  | "rotate"
  | "send"
  | "snow"
  | "star"
  | "target"
  | "trash"
  | "user"
  | "wallet";
