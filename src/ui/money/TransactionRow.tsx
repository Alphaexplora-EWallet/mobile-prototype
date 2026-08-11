/**
 * The transaction row, previously hand-written in three screens. Adding the
 * activity, bill and QR screens would have made that five.
 *
 * Two details are load-bearing and easy to lose:
 *
 * - `incoming` is optional, and the *absence* of it is meaningful. Home renders
 *   a signed amount, so its `<strong>` carries `class=""` or `class="positive"`;
 *   the scheduled-payment rows on Pay render no sign at all, so their `<strong>`
 *   has no class attribute. Those serialise differently and both are in the
 *   golden snapshot.
 * - `type` is written before `className` because that is the attribute order the
 *   snapshot recorded.
 */
export type TransactionRowView = {
  id: string;
  glyph: string;
  name: string;
  when: string;
  amountLabel: string;
  /** Omit for rows that never show a direction (scheduled payments). */
  incoming?: boolean;
  /** Second line under the amount. Activity rows only. */
  statusLabel?: string;
};

export function TransactionRow({
  row,
  className,
  onPress,
}: {
  row: TransactionRowView;
  className?: string;
  onPress?: () => void;
}) {
  const amount =
    row.incoming === undefined ? (
      <strong>{row.amountLabel}</strong>
    ) : (
      <strong className={row.incoming ? "positive" : ""}>{row.amountLabel}</strong>
    );

  return (
    <button type="button" className={className ? `transaction-row ${className}` : "transaction-row"} onClick={onPress}>
      <span className="transaction-icon">{row.glyph}</span>
      <span className="transaction-copy">
        <strong>{row.name}</strong>
        <small>{row.when}</small>
      </span>
      {row.statusLabel === undefined ? (
        amount
      ) : (
        <span className="activity-row-amount">
          {amount}
          <small>{row.statusLabel}</small>
        </span>
      )}
    </button>
  );
}
