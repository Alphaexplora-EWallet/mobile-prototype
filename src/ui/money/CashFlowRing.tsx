/**
 * The Home cash-flow ring: two arcs, income and expenses, sized from the shares
 * its ViewModel computed.
 *
 * It replaced four hardcoded arcs whose dash arrays encoded no data at all and
 * whose colours implied a four-way category split the card never showed. The
 * geometry is the only thing decided here — turning a percentage into an arc
 * length is presentation, so it belongs in the view; the percentages themselves
 * come from the ViewModel, which is the only layer allowed to read money.
 */

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A whole percent to an arc length, clamped so bad input cannot overdraw. */
const arc = (percent: number) => (Math.min(Math.max(percent, 0), 100) / 100) * CIRCUMFERENCE;

export function CashFlowRing({
  incomePercent,
  expensePercent,
  label,
}: {
  incomePercent: number;
  expensePercent: number;
  label: string;
}) {
  const income = arc(incomePercent);

  return (
    <svg viewBox="0 0 100 100" className="cashflow-donut" role="img" aria-label={label}>
      <circle
        className="cashflow-arc cashflow-arc-income"
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        strokeWidth="14"
        strokeDasharray={`${income} ${CIRCUMFERENCE}`}
      />
      <circle
        className="cashflow-arc cashflow-arc-expenses"
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        strokeWidth="14"
        strokeDasharray={`${arc(expensePercent)} ${CIRCUMFERENCE}`}
        strokeDashoffset={-income}
      />
      {/* Punches the hole. Fill has to match the card, hence the token. */}
      <circle cx="50" cy="50" r="31" fill="var(--surface)" />
      <text x="50" y="56" textAnchor="middle" className="cashflow-donut-glyph">
        ₱
      </text>
    </svg>
  );
}
