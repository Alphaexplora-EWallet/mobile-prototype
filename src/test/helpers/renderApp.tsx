import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { PlatformProvider } from "@/core/platform/PlatformContext";
import { noopPlatform } from "@/core/platform/noopPlatform";
import type { Platform } from "@/core/platform/ports";
import { createMockNetBankGateway, type MockGatewayOptions } from "@/platform/web/createMockNetBankGateway";
import { MOCK_SESSIONS } from "@/core/data/mock/security.mock";
import { MOCK_USER } from "@/core/data/mock/user.mock";
import type { AuthSession } from "@/core/domain/session";
import { sessionActions } from "@/core/stores/session.store";

/**
 * The render harness every flow test used to redefine for itself.
 *
 * It exists now because the session gate made the copies diverge in a way that
 * mattered: the app opens on a splash until storage says whether anyone is
 * signed in, so a test that renders and immediately queries a button finds
 * nothing. Seeding the status synchronously — before `render` — is what skips
 * that, and it belongs in one place rather than twenty.
 *
 * The bridge deliberately leaves a settled status alone, which is what makes
 * this work: no storage round trip happens at all.
 */

export type TestUser = ReturnType<typeof userEvent.setup>;

/** The session a signed-in test starts from: the seeded fixture user. */
export const MOCK_AUTH_SESSION: AuthSession = {
  token: "sess-test",
  user: MOCK_USER,
  deviceName: MOCK_SESSIONS[0].deviceName,
};

export const seedSignedIn = (session: AuthSession = MOCK_AUTH_SESSION): void => sessionActions.signedIn(session);

export const seedSignedOut = (): void => sessionActions.signedOut();

const mount = (options: MockGatewayOptions, platform: Platform) => {
  const user = userEvent.setup();
  const view = render(
    <BankingGatewayProvider gateway={createMockNetBankGateway(options)}>
      <PlatformProvider platform={platform}>
        <App />
      </PlatformProvider>
    </BankingGatewayProvider>,
  );
  return { user, view };
};

/**
 * Renders the app already signed in, on Home.
 *
 * Tests of the money flows used to walk `Start my journey → Continue → Close
 * result` first, which was three interactions of onboarding to reach the screen
 * under test. Seeding the session is both shorter and truer: a returning user
 * does not re-onboard.
 */
export const renderApp = (options: MockGatewayOptions = {}, platform: Platform = noopPlatform): TestUser => {
  seedSignedIn();
  return mount(options, platform).user;
};

/** Same, but returning the render result for tests that snapshot the container. */
export const renderAppView = (options: MockGatewayOptions = {}, platform: Platform = noopPlatform) => {
  seedSignedIn();
  return mount(options, platform);
};

/**
 * Renders the app signed out, on Welcome — for the auth flows themselves and
 * for the golden snapshot, which is the one test that should still walk the real
 * journey from the beginning.
 */
export const renderSignedOut = (options: MockGatewayOptions = {}, platform: Platform = noopPlatform) => {
  seedSignedOut();
  return mount(options, platform);
};

/**
 * Renders without touching the session at all, so the status stays `"unknown"`
 * and the bridge really does ask storage — the only way to test what a reload
 * does. Pair it with a platform whose storage holds something.
 */
export const renderHydrating = (options: MockGatewayOptions = {}, platform: Platform = noopPlatform) =>
  mount(options, platform);

/** An in-memory `StoragePort`, for the reload tests. `noopPlatform` keeps nothing. */
export const storagePlatform = (seed: Readonly<Record<string, string>> = {}): Platform => {
  const values = new Map(Object.entries(seed));
  return {
    ...noopPlatform,
    storage: {
      getItem: async (key: string) => values.get(key) ?? null,
      setItem: async (key: string, value: string) => void values.set(key, value),
      removeItem: async (key: string) => void values.delete(key),
    },
  };
};

export const press = async (user: TestUser, name: RegExp | string) => user.click(screen.getByRole("button", { name }));
