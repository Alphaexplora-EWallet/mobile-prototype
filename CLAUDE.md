# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FIN-A Wallet — a simulated Philippine e-wallet prototype (Vite + React 19 + TypeScript + Zustand, no
backend). `README.md` carries the narrative rationale and a list of deliberate shortcuts; read it
before proposing changes to money handling, the quest ring, or navigation.

## Commands

```bash
npm run dev                       # Vite dev server, http://localhost:5173
npm run verify                    # typecheck → lint → format:check → test → build. Run before committing.
npm run test -- src/core/money/money.test.ts        # one file
npm run test -- -t "simulated action sheet"         # one test by name
npm run test:watch
npm run lint:fix && npm run format
```

`verify` is the gate — a change is not done until it passes. `typecheck` is `tsc -b` with
`noUnusedLocals`/`noUnusedParameters`, so dead bindings fail the build, not just the linter.

## Layering

The top-level split is by **platform dependence**, not by feature, because the target is a React
Native port:

- `src/core/**` — Model + ViewModel. Must survive the RN port verbatim. Contains `money/`,
  `domain/`, `data/` (mock fixtures), `stores/` (Zustand), `navigation/`, `platform/` (port
  interfaces), `viewmodels/`.
- `src/ui/**` — Views only. Rewritten for RN.
- `src/platform/web/**`, `src/app/bridges/**`, `src/main.tsx` — the web-only edge.
- `src/styles/**` — global CSS; only `tokens.css` survives the port.

Two invariants are enforced by ESLint (`eslint.config.js`) and are not negotiable in new code:

1. **No web globals outside `src/platform/`, `src/app/bridges/`, `src/main.tsx`, `src/test/`.**
   `window`, `document`, `localStorage`, `sessionStorage`, `matchMedia`, `navigator` are banned via
   `no-restricted-globals`. Anything the device answers differently goes behind a port in
   `core/platform/ports.ts`, injected at `main.tsx` through `PlatformProvider`. Ports are async and
   push-based even where web could answer synchronously — `AsyncStorage` and `AccessibilityInfo`
   are async on device, so the shape is fixed now.
2. **Views never import `@/core/stores/*`, `@/core/data/*`, or `@/core/money/*`** (`no-restricted-imports`
   scoped to `src/ui/**`). A view that needs a formatted peso amount gets the finished string from
   its ViewModel.

`core/` may import from `ui/` only for the `Theme` type (`@/ui/theme/ThemeContext`), and only as a
`import type`. Keep it that way.

## Patterns to follow

**Path alias.** `@/*` → `src/*`, declared in both `vite.config.ts` and `tsconfig.app.json`. Files
inside `core/` mostly use relative imports among themselves; crossing a top-level boundary uses `@/`.

**ViewModels.** One `use*ViewModel` per screen in `core/viewmodels/`. A ViewModel reads stores,
composes domain derivations, and returns render-ready data plus named commands (`pressCard`,
`toggleBalance`) — never raw state. Screens take **no props**; each reads its own ViewModel. Shared
derivations live in their own hook (`useCardViews`, `useCardPrivacy`, `useReduceMotion`) rather than
being duplicated per screen.

**Stores.** Each Zustand store nests its mutators under an `actions` object and exports them as a
module singleton (`export const walletActions = useWalletStore.getState().actions`). Import actions
directly; never select them — they are stable and add no subscription. Guard no-op writes
(`if (get().selectedCardId === id) return`) since equal writes still wake subscribers. Any new store
must be reset in `core/app/resetStores.ts`.

**Money.** Integer minor units only (`Money = { amount, currency }`, centavos for PHP). Build with
`pesos(24_680.5)`, never a float or a display string. Formatting (`formatMoney`,
`formatSignedMoney`, `maskMoney`) happens **only** at the ViewModel boundary. The formatter is
hand-rolled on purpose — U+2212 minus, environment-independent snapshots, Hermes Intl gaps — so do
not "simplify" it to `Intl.NumberFormat`.

**Navigation.** `core/navigation/` is a hand-rolled stack shaped like React Navigation
(`ScreenParams`, `useNavigation()` with `navigate`/`goBack`/`switchTab`/`resetTo`). Adding a screen
means: an entry in `ScreenParams`, a component, and a row in the `SCREENS` map in `src/App.tsx` —
that map is the only place ids meet components. Route params stay empty; resumable flow state
(e.g. the quest limit-setup step) belongs in a store so it survives a tab switch. `TAB_ITEMS` in
`navigation/screens.ts` is the single source of truth for the tab bar.

**Web-only side effects** go in `app/bridges/` as components that render `null` (see `ThemeBridge`:
storage + `documentElement` writes, paired with the pre-paint inline script in `index.html`). Stores
stay free of persistence middleware for this reason.

**CSS.** `styles/index.css` import order _is_ the cascade order — `dark.css` and `responsive.css`
must load last. Do not rearrange.

## Testing

`src/test/app.flow.test.tsx` is a **golden snapshot** of all 12 screens and the full quest flow,
captured against the original single-file app before the restructure. It is the only evidence the
restructure preserved behaviour.

> Never run `vitest -u` to make it pass. A red snapshot means rendering changed — investigate. If the
> change is genuinely intended, say so explicitly and note it in the commit message.

`src/test/setup.ts` resets the singleton stores after each test and stubs `localStorage`,
`matchMedia` (pinned to light theme), and `scrollTo`, none of which exist in this jsdom/Node 26
combination. Snapshots are `.prettierignore`d.

## Known exemptions in the lint config

`react-hooks/set-state-in-effect` is `warn`, not `error`, for a legacy reset-on-deselect effect;
`src/App.tsx` is no longer exempt from the web-API fence. Prefer resolving these over widening the
exemptions.
