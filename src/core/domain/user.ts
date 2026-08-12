/**
 * Who the user is, as its own thing.
 *
 * The app previously had no notion of a person at all — the name on the Profile
 * screen came from `MOCK_CARDHOLDER`, a fixture describing what is *printed on a
 * card*. That conflates two facts that diverge the moment a wallet has more than
 * one card, and it left mobile, email and account status with nowhere to live.
 *
 * The shape follows `identity.users` in docs/backend-architecture.md so the
 * eventual server model and this one do not have to be reconciled later.
 */

/**
 * `restricted` is what a compliance hold looks like from the client's side: the
 * account exists and can be read, but money cannot move. Modelled now because
 * the tier system that produces it already exists.
 */
export type UserStatus = "active" | "restricted" | "closed";

export type UserProfile = {
  fullName: string;
  /** Stored in display form, as every other string in this prototype is. */
  mobile: string;
  email: string;
  memberSinceLabel: string;
  status: UserStatus;
};

export const USER_STATUS_LABELS: Readonly<Record<UserStatus, string>> = {
  active: "Active",
  restricted: "Restricted",
  closed: "Closed",
};

/**
 * `"+63 917 555 2288"` → `"0917 ••• 2288"`, matching the masked destination the
 * OTP screens already show. Falls back to the whole string when there is not
 * enough of a number to mask, because a half-masked number is worse than none.
 */
export const maskMobile = (mobile: string): string => {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length < 10) return mobile;
  const last4 = digits.slice(-4);
  const prefix = digits.startsWith("63") ? `0${digits.slice(2, 5)}` : digits.slice(0, 4);
  return `${prefix} ••• ${last4}`;
};

/** `"maya.santos@example.ph"` → `"ma•••@example.ph"`. */
export const maskEmail = (email: string): string => {
  const at = email.indexOf("@");
  if (at < 1) return email;
  const local = email.slice(0, at);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}•••${email.slice(at)}`;
};
