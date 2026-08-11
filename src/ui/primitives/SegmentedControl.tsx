/**
 * A small set of mutually exclusive choices, each of which may need a line of
 * explanation — picking InstaPay over PESONet is a decision about cost and
 * timing, so the detail line is not decoration.
 *
 * Buttons rather than radios because the rest of the app signals selection with
 * `aria-pressed`, and the test suite navigates by accessible name.
 */
export type SegmentOption = {
  id: string;
  label: string;
  detail?: string;
  disabled?: boolean;
};

export function SegmentedControl({
  label,
  options,
  selectedId,
  onSelect,
}: {
  label: string;
  options: readonly SegmentOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          className={`segment ${option.id === selectedId ? "is-selected" : ""}`}
          key={option.id}
          disabled={option.disabled}
          aria-pressed={option.id === selectedId}
          onClick={() => onSelect(option.id)}
        >
          <strong>{option.label}</strong>
          {option.detail && <small>{option.detail}</small>}
        </button>
      ))}
    </div>
  );
}
