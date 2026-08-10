export function AmountField({
  label,
  value,
  onChange,
  available,
  presets,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  available: string;
  presets: readonly string[];
}) {
  return (
    <section className="money-field">
      <span className="field-label">{label}</span>
      <div className="amount-field">
        <span className="amount-input">
          <span className="amount-currency" aria-hidden="true">
            ₱
          </span>
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={label}
          />
        </span>
        <small className="amount-available">Available {available}</small>
      </div>
      <div className="amount-presets">
        {presets.map((preset) => (
          <button
            className={`amount-preset ${value === preset ? "is-selected" : ""}`}
            type="button"
            key={preset}
            onClick={() => onChange(preset)}
            aria-pressed={value === preset}
          >
            ₱{preset}
          </button>
        ))}
      </div>
    </section>
  );
}
