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
