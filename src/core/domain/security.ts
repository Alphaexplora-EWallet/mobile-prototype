/**
 * Confirmation factors. The prototype moved money on a single button press with
 * nothing between the review screen and the rail; these types describe the step
 * that belongs there.
 */
export type OtpPurpose = "sign-in" | "payment" | "password-reset" | "device-binding";

export type OtpChallenge = {
  /** e.g. "0917 ••• 2288" — what the code was sent to. */
  maskedDestination: string;
  expiresInLabel: string;
  digits: number;
};

/**
 * Proof that a confirmation factor was satisfied, handed to `payments.submit`.
 * Opaque to the client: only the adapter knows how to check it.
 */
export type ConfirmationToken = string;

/**
 * Passed to `payments.submit` for intents that do not step up (see
 * `requiresStepUp`). A sentinel rather than an optional argument so that
 * "no factor was needed" is stated at the call site instead of inferred from an
 * omission — the adapter re-checks the rule and rejects the sentinel when the
 * intent did in fact require a factor.
 */
export const NO_CONFIRMATION_REQUIRED: ConfirmationToken = "not-required";

export type ConfirmationMethod = "pin" | "otp";

/** The length of the transaction PIN the confirm screen collects. */
export const TRANSACTION_PIN_LENGTH = 6;

export type DeviceSession = {
  id: string;
  deviceName: string;
  location: string;
  lastActiveLabel: string;
  current: boolean;
};
