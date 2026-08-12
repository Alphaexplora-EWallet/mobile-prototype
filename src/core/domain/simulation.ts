/**
 * The integration seam. Every money-moving action in this prototype resolves
 * to a simulated result instead of touching a service. When a real backend
 * arrives, the result type grows a union (Confirmed | Declined | Simulated)
 * and the call sites stay where they are.
 */
export const SIMULATED_NOTE =
  "This frontend prototype keeps financial actions safely simulated. The real service can connect here later.";

export type SimulatedResult = {
  kind: "simulated";
  title: string;
  body: string;
};

export const simulated = (title: string): SimulatedResult => ({
  kind: "simulated",
  title,
  body: SIMULATED_NOTE,
});

/**
 * What a confirmed sheet does. An id rather than a callback, because the sheet
 * lives in a store: a function held in state does not survive serialisation,
 * does not compare equal between renders, and would be the one field in the
 * store that cannot be inspected in a snapshot. The shell resolves the id.
 */
export type SheetAction = "sign-out";

/**
 * A question rather than an announcement. Sign-out is the first caller —
 * throwing away the session on a single unguarded tap is the kind of thing a
 * wallet should ask about.
 */
export type ConfirmRequest = {
  kind: "confirm";
  title: string;
  body: string;
  confirmLabel: string;
  action: SheetAction;
};

export const confirmRequest = (request: Omit<ConfirmRequest, "kind">): ConfirmRequest => ({
  kind: "confirm",
  ...request,
});

/** Everything the one modal in this app can be asked to show. */
export type SheetResult = SimulatedResult | ConfirmRequest;
