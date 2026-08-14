/**
 * Seamless ambient luminous glow backdrop behind the Home balance heading.
 * Uses 100% edge-faded radial gradients so there are zero hard crop lines or cutoffs.
 */
export function HomeSkyline() {
  return (
    <svg className="home-skyline" viewBox="0 0 320 200" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="skyline-glow-amber" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="skyline-glow-blue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#60a5fa" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* 100% seamlessly faded ambient glowing orbs with zero hard edges */}
      <circle cx="200" cy="55" r="95" fill="url(#skyline-glow-amber)" />
      <circle cx="260" cy="75" r="110" fill="url(#skyline-glow-blue)" />
    </svg>
  );
}
