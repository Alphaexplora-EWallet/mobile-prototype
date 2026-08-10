import { useTheme } from "../theme/ThemeContext";
import { BRAND } from "../assets";

export function BrandMark({
  compact = false,
  tagline = false,
  light = false,
  preserveInk = false,
}: {
  compact?: boolean;
  tagline?: boolean;
  light?: boolean;
  preserveInk?: boolean;
}) {
  const theme = useTheme();
  const useLightWordmark = light || (theme === "dark" && !preserveInk);
  return (
    <img
      className={`brand-mark ${compact ? "brand-mark-compact" : ""} ${tagline ? "brand-mark-lockup" : ""}`}
      src={tagline ? BRAND.lockup : useLightWordmark ? BRAND.wordmarkLight : BRAND.wordmark}
      alt={tagline ? "FIN-A, Financial Assistant App" : "FIN-A"}
    />
  );
}
