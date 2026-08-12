/**
 * Levels, derived from an XP total.
 *
 * "Level 3" and "75%" used to be string and number literals sitting in three
 * unrelated places — the Home ViewModel, the Profile ViewModel, and the Reward
 * screen's JSX — which is how the README came to list *"Level progress reads 75%
 * on Home and Profile but 76% on Reward"* as a known shortcut. One number in the
 * quest store and one function here makes that class of drift unrepresentable.
 *
 * A flat cost per level, not a curve. `engagement.user_levels` in
 * docs/backend-architecture.md will own the real schedule; until then a curve
 * would be invented precision.
 */
export const XP_PER_LEVEL = 500;

export type LevelProgress = {
  level: number;
  /** XP earned since this level began. */
  xpIntoLevel: number;
  /** XP still needed to reach the next level. */
  xpToNext: number;
  /** Whole percent through the current level, for the progress bar. */
  percent: number;
};

export const levelFromXp = (xp: number): LevelProgress => {
  const total = Math.max(0, Math.floor(xp));
  const xpIntoLevel = total % XP_PER_LEVEL;
  return {
    level: Math.floor(total / XP_PER_LEVEL) + 1,
    xpIntoLevel,
    xpToNext: XP_PER_LEVEL - xpIntoLevel,
    // Rounded here rather than at each call site, so the bar's width and any
    // label printed beside it are the same number by construction.
    percent: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
  };
};
