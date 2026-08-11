/**
 * The label/value card used by review, receipt and transaction detail — and, from
 * here on, by every screen in the payment pipeline.
 *
 * Rows arrive already filtered: a caller with an optional field passes it only
 * when it has a value, rather than the component deciding what "empty" means for
 * a fee versus a note.
 */
export type DetailRow = {
  label: string;
  value: string;
  /** Renders the value as an incoming amount. */
  positive?: boolean;
};

export function DetailCard({
  label,
  rows,
  className,
}: {
  /** Accessible name for the group, e.g. "Transfer receipt details". */
  label: string;
  rows: readonly DetailRow[];
  className?: string;
}) {
  return (
    <section className={className ? `detail-card ${className}` : "detail-card"} aria-label={label}>
      {rows.map((row) => (
        <div key={row.label}>
          <span>{row.label}</span>
          <strong className={row.positive ? "positive" : undefined}>{row.value}</strong>
        </div>
      ))}
    </section>
  );
}
