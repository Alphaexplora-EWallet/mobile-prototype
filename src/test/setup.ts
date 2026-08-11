import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { resetStores } from "@/core/app/resetStores";

afterEach(() => {
  cleanup();
  // Stores are module singletons, so state survives unmount and would leak
  // into the next test.
  resetStores();
});

// Node 26 gates its own localStorage behind --localstorage-file, so
// window.localStorage is undefined here. The web StoragePort adapter
// (src/platform/web/createWebPlatform.ts) reads it on mount, which throws
// before anything renders.
if (!window.localStorage) {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    },
  });
}

// jsdom implements neither of these, and the app touches both on mount:
// the web platform adapters (AppearancePort/AccessibilityPort in
// src/platform/web/createWebPlatform.ts) call matchMedia, and navigate()
// calls scrollTo. Without these stubs the very first render throws.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false, // pins tests to light theme, deterministically
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

window.scrollTo = vi.fn();
