/**
 * Decorative sun/mountain skyline behind the Home balance heading. Inline SVG
 * (not a raster asset) so its fills key off the same CSS custom properties
 * dark.css already repoints for `data-theme="dark"` — no theme branching here.
 */
export function HomeSkyline() {
  return (
    <svg className="home-skyline" viewBox="0 0 300 160" aria-hidden="true" focusable="false">
      <circle className="home-skyline-sun" cx="221" cy="38" r="17" />
      <path
        className="home-skyline-mountain-far"
        d="M96 150c10-46 34-78 70-78s58 30 70 66c8-14 20-24 34-24 12 0 22 6 30 16v40H96z"
      />
      <path className="home-skyline-mountain-near" d="M40 160c14-58 46-96 92-96 44 0 78 36 92 88v8H40z" />
    </svg>
  );
}
