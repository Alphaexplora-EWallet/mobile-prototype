/**
 * Draws a module grid as one inline SVG. No external library: the CSP on a
 * published build blocks CDN scripts, and a QR renderer is the wrong dependency
 * to add for a pattern the ViewModel already computes.
 *
 * Dark modules only — the light ones are the background, which halves the
 * element count. On React Native this becomes `<Svg>`/`<Rect>` unchanged.
 */
export function QrCode({ matrix, title }: { matrix: readonly (readonly boolean[])[]; title: string }) {
  const size = matrix.length;

  return (
    <svg className="qr-matrix" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title}>
      <rect width={size} height={size} fill="var(--cream)" />
      {matrix.map((row, rowIndex) =>
        row.map((filled, columnIndex) =>
          filled ? (
            <rect
              key={`${rowIndex}-${columnIndex}`}
              x={columnIndex}
              y={rowIndex}
              width={1}
              height={1}
              fill="var(--ink)"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
