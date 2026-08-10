import { createContext, useContext, type ReactNode } from "react";
import type { Platform } from "./ports";
import { noopPlatform } from "./noopPlatform";

/**
 * React context is portable, so this lives in core. The *implementations* it
 * carries are not, which is why they are injected at the entry point rather
 * than imported here.
 */
const PlatformContext = createContext<Platform>(noopPlatform);

export function PlatformProvider({ platform, children }: { platform: Platform; children: ReactNode }) {
  return <PlatformContext.Provider value={platform}>{children}</PlatformContext.Provider>;
}

export const usePlatform = (): Platform => useContext(PlatformContext);
