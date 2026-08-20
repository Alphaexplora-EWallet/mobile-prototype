import finaLogoLockup from "./fina-logo-lockup.svg";
import finaWordmark from "./fina-wordmark.svg";
import finaWordmarkLight from "./fina-wordmark-light.svg";
import finaLogoUpdated from "./fina-logo-updated.png";
import finaWordmarkDarkPng from "./fina-wordmark-dark.png";
import finaWordmarkLightPng from "./fina-wordmark-light.png";
import sunsetJeepney from "./sunset-jeepney.webp";
import welcomeManila from "./welcome-manila.webp";

import type { CardArtworkId } from "@/core/domain/card";

/**
 * The only module in the app that imports an image.
 *
 * Bundlers disagree about what an image import evaluates to — a URL string
 * under Vite, an opaque module id under Metro/React Native. Funnelling every
 * import through here means the domain refers to artwork by name and this one
 * file is what the React Native port rewrites.
 */
export const ARTWORK: Record<CardArtworkId, string> = {
  "sunset-jeepney": sunsetJeepney,
};

export const BRAND = {
  lockup: finaLogoLockup,
  wordmark: finaWordmark,
  wordmarkLight: finaWordmarkLight,
  logoPng: finaLogoUpdated,
  wordmarkDarkPng: finaWordmarkDarkPng,
  wordmarkLightPng: finaWordmarkLightPng,
} as const;

export const IMAGERY = {
  welcomeManila,
  sunsetJeepney,
} as const;
