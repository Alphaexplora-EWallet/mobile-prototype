/**
 * The MPIN — the credential that gets you *into* the app.
 *
 * Deliberately not the same thing as `TRANSACTION_PIN_LENGTH` in `security.ts`,
 * which guards a single payment once you are already in. Two credentials, two
 * rules, two places to change them; merging them would mean a stolen MPIN also
 * moves money.
 *
 * The weak-PIN rules are the ones a real issuer enforces at enrolment. They are
 * here rather than in the mock gateway because both sides need them: the screen
 * refuses a weak PIN before asking, and the adapter re-checks what it is handed.
 */

export const MPIN_LENGTH = 6;

export type PinIssue = "too-short" | "repeated" | "sequential" | "mismatch";

const isRepeated = (pin: string): boolean => pin.split("").every((digit) => digit === pin[0]);

/** Runs of consecutive digits in either direction — `123456` and `987654` alike. */
const isSequential = (pin: string): boolean => {
  const steps = pin.split("").map((digit) => Number(digit));
  const delta = steps[1] - steps[0];
  if (delta !== 1 && delta !== -1) return false;
  return steps.every((digit, index) => index === 0 || digit - steps[index - 1] === delta);
};

/**
 * Why this PIN cannot be used, or `null` when it can. Input is assumed to be
 * digits already — every field that collects a PIN strips non-digits as it is
 * typed, so anything else fails the length check first.
 */
export const pinIssue = (pin: string): PinIssue | null => {
  if (pin.length !== MPIN_LENGTH || !/^\d+$/.test(pin)) return "too-short";
  if (isRepeated(pin)) return "repeated";
  if (isSequential(pin)) return "sequential";
  return null;
};

/** The second-entry check, kept separate so the first field can pass on its own. */
export const confirmPinIssue = (pin: string, confirm: string): PinIssue | null => (confirm === pin ? null : "mismatch");

export const pinIssueMessage = (issue: PinIssue): string => PIN_ISSUE_MESSAGES[issue];

const PIN_ISSUE_MESSAGES: Readonly<Record<PinIssue, string>> = {
  "too-short": `Your MPIN must be ${MPIN_LENGTH} digits.`,
  repeated: "Avoid an MPIN that repeats one digit.",
  sequential: "Avoid an MPIN in counting order.",
  mismatch: "Both entries must match.",
};
