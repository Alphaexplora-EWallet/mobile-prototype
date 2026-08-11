/**
 * A deterministic module grid for displaying a QR PH payload.
 *
 * This is **not** a QR encoder. A real one needs Reed-Solomon error correction,
 * mode/version selection and masking, and shipping an unverified implementation
 * of that would produce codes that look right and scan wrong — worse than not
 * having one. The screen that renders this says so on the face of it.
 *
 * What it does give: a stable, payload-derived pattern with correct finder and
 * timing structure, so the same payload always draws the same code and two
 * different payloads visibly differ. Returns plain booleans, so the React Native
 * port draws the same grid with `<Rect>` instead of `<rect>`.
 */
export const QR_MATRIX_SIZE = 25;

const FINDER_SIZE = 7;

/** FNV-1a. Small, dependency-free, and spreads single-character changes well. */
const hash = (value: string): number => {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193) >>> 0;
  }
  return result >>> 0;
};

/** The 7x7 corner squares: filled ring, gap, filled 3x3 core. */
const isFinderModule = (row: number, column: number): boolean => {
  const onRing = row === 0 || row === 6 || column === 0 || column === 6;
  const inCore = row >= 2 && row <= 4 && column >= 2 && column <= 4;
  return onRing || inCore;
};

const inFinderZone = (row: number, column: number): "finder" | "quiet" | null => {
  const corners = [
    { top: 0, left: 0 },
    { top: 0, left: QR_MATRIX_SIZE - FINDER_SIZE },
    { top: QR_MATRIX_SIZE - FINDER_SIZE, left: 0 },
  ];
  for (const corner of corners) {
    const withinFinder =
      row >= corner.top &&
      row < corner.top + FINDER_SIZE &&
      column >= corner.left &&
      column < corner.left + FINDER_SIZE;
    if (withinFinder) return isFinderModule(row - corner.top, column - corner.left) ? "finder" : "quiet";
    // The one-module separator that has to stay light around each finder.
    const withinSeparator =
      row >= corner.top - 1 &&
      row <= corner.top + FINDER_SIZE &&
      column >= corner.left - 1 &&
      column <= corner.left + FINDER_SIZE;
    if (withinSeparator) return "quiet";
  }
  return null;
};

export function qrMatrix(payload: string): readonly (readonly boolean[])[] {
  const seed = hash(payload);

  return Array.from({ length: QR_MATRIX_SIZE }, (_, row) =>
    Array.from({ length: QR_MATRIX_SIZE }, (_, column) => {
      const zone = inFinderZone(row, column);
      if (zone) return zone === "finder";

      // Timing lines, which alternate along row 6 and column 6 in a real code.
      if (row === 6) return column % 2 === 0;
      if (column === 6) return row % 2 === 0;

      const mixed = Math.imul(seed ^ Math.imul(row + 1, 0x9e3779b1), column * 2 + 3) >>> 0;
      return ((mixed >>> 7) & 1) === 1;
    }),
  );
}
