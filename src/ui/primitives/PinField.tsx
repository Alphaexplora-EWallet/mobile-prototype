/**
 * The one-wide-letter-spaced-input field that collects a code or a PIN.
 *
 * Extracted because it was copy-pasted in three screens with only the label and
 * the `type` differing, and the auth flow needed it three more times. The
 * markup is byte-identical to what those screens rendered before, which is what
 * lets the retrofit land without touching a single snapshot.
 *
 * Deliberately not a row of per-digit boxes: one input keeps the platform's
 * one-time-code autofill working, and a native numeric keyboard is what every
 * other field in this app uses.
 *
 * How many digits are expected and how the value is sanitised are the
 * ViewModel's business — this only renders and reports keystrokes.
 */
export function PinField({
  label,
  value,
  onChange,
  digits,
  secret = false,
  autoComplete = "one-time-code",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  digits: number;
  /** Masks the entry, for a PIN rather than a code sent in the clear. */
  secret?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="pin-field">
      <span className="field-label">{label}</span>
      <input
        type={secret ? "password" : "text"}
        inputMode="numeric"
        autoComplete={autoComplete}
        placeholder={"•".repeat(digits)}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
