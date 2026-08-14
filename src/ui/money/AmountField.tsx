export function AmountField({
  label,
  value,
  onChange,
  available,
  presets,
  selectedPresetId,
  onSelectPreset,
  onMax,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  available: string;
  presets: readonly { id: string; label: string }[];
  selectedPresetId: string | null;
  onSelectPreset: (id: string) => void;
  onMax?: () => void;
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
        <div className="amount-meta-row">
          <small className="amount-available">Available {available}</small>
          {onMax && (
            <button type="button" className="amount-max-btn" onClick={onMax}>
              Use max
            </button>
          )}
        </div>
      </div>
      {presets.length > 0 && (
        <div className="amount-presets">
          {presets.map((preset) => (
            <button
              className={`amount-preset ${selectedPresetId === preset.id ? "is-selected" : ""}`}
              type="button"
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              aria-pressed={selectedPresetId === preset.id}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
