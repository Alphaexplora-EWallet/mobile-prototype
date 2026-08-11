/**
 * Every gateway call returns a result rather than throwing. The previous
 * `createTransfer` threw, and its only caller did `catch {}` with no binding —
 * so the reason a payment failed could never reach the screen. A closed set of
 * codes means a ViewModel can branch on the failure, and `message` means it can
 * show something true without inventing copy per call site.
 */
export type GatewayErrorCode =
  | "insufficient-funds"
  | "limit-exceeded"
  | "invalid-account"
  | "rail-unavailable"
  | "rail-cutoff-passed"
  | "kyc-required"
  | "confirmation-required"
  | "duplicate-request"
  | "not-found"
  | "network";

export type GatewayError = {
  code: GatewayErrorCode;
  /** Shown to the user as-is. The adapter owns this copy, not the view. */
  message: string;
};

export type GatewayResult<T> = { ok: true; value: T } | { ok: false; error: GatewayError };

export const ok = <T>(value: T): GatewayResult<T> => ({ ok: true, value });

/**
 * Returns `GatewayResult<never>`, which is assignable to `GatewayResult<T>` for
 * any T — so a failure branch never needs to name the success type.
 */
export const failed = (code: GatewayErrorCode, message: string): GatewayResult<never> => ({
  ok: false,
  error: { code, message },
});

/** True when a failure is worth offering a retry button for. */
export const isRetryable = (error: GatewayError): boolean =>
  error.code === "network" || error.code === "rail-unavailable";
