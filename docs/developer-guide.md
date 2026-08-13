# FIN-A Wallet — Developer Guide

Status: **current** — every file reference verified against the tree at commit `3e7f955`
(2026-08-13). This is the hands-on companion to `docs/frontend-architecture.md`: it covers setup,
the repository map, and the concrete steps for adding a screen or feature. Read
`frontend-architecture.md` for the _why_ behind the layering; this guide is the _how_.

## 1. Prerequisites and setup

The toolchain is Node + npm only — no backend, no build-time codegen, no native deps.

```bash
node --version   # developed on Node 26 (jsdom/Node-26 specifics are stubbed in src/test/setup.ts)
npm install      # installs the locked dependencies (package-lock.json)
npm run dev      # Vite dev server → http://localhost:5173
```

`npm run verify` is the pre-commit gate: **typecheck → lint → format:check → test → build**, in
that order (defined in `package.json`). A change is not done until it passes.

| Script                  | What it does                                                             |
| ----------------------- | ------------------------------------------------------------------------ |
| `dev`/`build`/`preview` | Vite (build also runs `tsc -b` first)                                    |
| `typecheck`             | `tsc -b --pretty false` — strict, `noUnusedLocals`, `noUnusedParameters` |
| `lint`/`lint:fix`       | ESLint, including the two architectural invariants (§4)                  |
| `format`/`format:check` | Prettier (120 cols, double quotes, semicolons, trailing commas)          |
| `test`/`test:watch`     | Vitest on jsdom                                                          |
| `verify`                | All of the above, in order                                               |

Useful half-commands while iterating:

```bash
npm run test -- src/core/money/money.test.ts     # one test file
npm run test -- -t "simulated action sheet"      # one test by name
npm run test:watch                               # interactive
npm run lint:fix && npm run format               # auto-fix before verify
```

## 2. Repository map

```
├── index.html              Pre-paint theme script + #root; only HTML file
├── vite.config.ts          @/* → src/* alias, vitest jsdom config
├── tsconfig.app.json       strict TS; @/* paths
├── eslint.config.js        The two architectural invariants live here (§4)
├── src/
│   ├── main.tsx            Web entry: builds web Platform + mock gateway, renders App
│   ├── App.tsx             SCREENS map — the only place a Screen id meets a component
│   ├── core/               Model + ViewModel. Survives the React Native port verbatim.
│   │   ├── app/            resetStores.ts, syncBalances.ts (web-free app logic)
│   │   ├── data/mock/      Fixtures — the prototype's "database" (one file per domain)
│   │   ├── domain/         Entity types + pure derivations, unit-tested beside modules
│   │   ├── money/          Integer-centavo Money, arithmetic, hand-rolled formatting
│   │   ├── navigation/     screens.ts (ScreenParams/TAB_ITEMS), navigation.store.ts, useNavigation.ts
│   │   ├── platform/       ports.ts (device seam) + bankingGateway.ts (bank seam) + providers
│   │   ├── stores/         21 Zustand stores + navigation.store
│   │   └── viewmodels/     26 use*ViewModel hooks + 3 shared derivations
│   ├── ui/                 Views only. Rewritten for RN.
│   │   ├── screens/        48 screen components, one per ScreenParams key
│   │   ├── cards/ layout/ money/ overlays/ primitives/ theme/ assets/
│   ├── platform/web/       createWebPlatform.ts, createMockNetBankGateway.ts
│   ├── app/bridges/        ThemeBridge.tsx, useFocusTrap.ts (renderless web side effects)
│   ├── styles/             21 CSS files by cascade layer (tokens.css survives the port)
│   └── test/               setup.ts + 17 flow tests + __snapshots__ (golden)
├── docs/                   Architecture, data-layer, developer guide, doc map (docs/README.md)
├── CHANGELOG.md            What actually shipped, from git history
└── DESIGN.md               Visual design guide (still says "EasyPay"; see docs/README.md)
```

**Where a screen id meets a component** is `src/App.tsx` (`SCREENS` record). **Where the tab bar
comes from** is `TAB_ITEMS` in `src/core/navigation/screens.ts`. **Where the app boots** is
`src/main.tsx`, which injects the two seams (see §5) and renders `<App />`.

## 3. Structure walkthrough

### 3.1 `core/` — the portable layer (Model + ViewModel)

- **`core/money/`** — `Money = { amount, currency }` with `amount` in integer centavos. Build with
  `pesos(24_680.5)`; never floats, never display strings. Formatting (`formatMoney`,
  `formatSignedMoney`, `maskMoney`, `parseMoneyInput` in `core/money/format.ts`) happens **only at
  the ViewModel boundary**. The formatter is hand-rolled on purpose (U+2212 minus, stable
  snapshots, Hermes Intl gaps) — do not swap it for `Intl.NumberFormat`.
- **`core/domain/`** — types and pure derivations with no I/O: `card.ts`, `banking.ts`,
  `paymentIntent.ts` (the `requiresStepUp` rule), `progress.ts` (level/XP), `spendingInsights.ts`
  (monthly aggregation), etc. Pure functions get `*.test.ts` files beside them.
- **`core/data/mock/`** — fixtures like `cards.mock.ts`, `user.mock.ts`, `payments.mock.ts`. These
  are the database. The mock gateway reads them; a real backend replaces the gateway, not these
  files (see `docs/data-layer.md` when it lands).
- **`core/stores/`** — 21 domain stores + `navigation.store.ts`. Conventions (see
  `wallet.store.ts` for the full pattern):
  - Mutators are nested under an `actions` object and exported as a module singleton:
    `export const walletActions = useWalletStore.getState().actions`. Import actions directly —
    never select them; they are stable and add no subscription.
  - Guard no-op writes (`if (get().selectedCardId === id) return`) — equal writes still wake
    subscribers.
  - **No persistence middleware.** Storage is a platform concern; `app/bridges/ThemeBridge.tsx`
    handles it on web. Every store stays identical across platforms.
  - Balance stores are caches of the bank's answer: the gateway settles, then
    `core/app/syncBalances.ts` re-reads balances and pushes them in (`walletActions.setBalances`).
    Never compute a balance locally.
- **`core/navigation/`** — a hand-rolled stack shaped like React Navigation. `screens.ts` defines
  `ScreenParams` (48 screens), `TAB_ITEMS` (5 tabs), `INITIAL_SCREEN` (`"welcome"`).
  `useNavigation()` returns `{ screen, canGoBack, navigate, goBack, switchTab, resetTo }`.
  Route params stay `undefined` on purpose — resumable flow state lives in stores so it survives a
  tab switch.
- **`core/viewmodels/`** — one `use*ViewModel` per screen (26) plus shared derivations
  (`useCardViews`, `useCardPrivacy`, `useReduceMotion`). A ViewModel reads stores, calls the
  gateway/platform ports, composes domain derivations, and returns **render-ready data plus named
  commands** (`pressCard`, `toggleBalance`, `goTo`). Never raw store state. Example:
  `useHomeViewModel.ts` formats every amount, maps transactions, and exposes `pressQuickAction`
  instead of navigation calls.

### 3.2 `ui/` — the view layer

Screens take **no props**; each reads its own ViewModel (`SpendingInsightsScreen.tsx` is a clean
example). Shared building blocks: `primitives/` (buttons, toggles, `StateBlock`), `cards/`
(`CardDeck`, `CardFace`), `money/` (`AmountField`, `TransactionRow`), `overlays/`
(`ActionSheet`), `layout/` (`BottomNav`, `PageBar`, `StatusBar`), `theme/` (`ThemeContext`).

### 3.3 `platform/web/` and `app/bridges/` — the web edge

- `platform/web/createWebPlatform.ts` — web implementations of all eight ports.
- `platform/web/createMockNetBankGateway.ts` — the mock bank: simulated latency (`latencyMs: 450`
  in `main.tsx`; tests default it to 0) and a seeded KYC rejection so the resubmission path is
  reachable.
- `app/bridges/ThemeBridge.tsx` — renders nothing; persists theme through the storage port and
  paints `documentElement.dataset.theme` (paired with the pre-paint script in `index.html`).
- `main.tsx` — the only place the web implementations are chosen.

### 3.4 `styles/`

Global CSS split by cascade layer. **`styles/index.css` import order _is_ the cascade order** —
`dark.css` and `responsive.css` must load last; do not rearrange. Only `tokens.css` survives the
RN port.

### 3.5 `test/`

Unit tests sit beside their modules; **flow tests live in `src/test/`** (`account.flow.test.tsx`,
`insights.flow.test.tsx`, …). `src/test/app.flow.test.tsx` is the **golden snapshot** — 15 snapshot
stops over 12 screens, captured against the pre-restructure monolith. It is the only evidence the
restructure preserved behaviour:

> **Never run `vitest -u` to make it pass.** A red snapshot means rendering changed. If the change
> is genuinely intended, say so explicitly and note it in the commit message.

`src/test/setup.ts` resets every singleton store after each test (`resetStores()` from
`core/app/resetStores.ts`) and stubs `localStorage`, `matchMedia` (pinned to light) and `scrollTo`
— none of which exist in this jsdom/Node 26 combination.

## 4. The two invariants (both machine-enforced in `eslint.config.js`)

1. **No web globals outside the web edge.** `window`, `document`, `localStorage`,
   `sessionStorage`, `matchMedia`, `navigator` are banned (`no-restricted-globals`) everywhere
   except `src/platform/`, `src/app/bridges/`, `src/main.tsx` and `src/test/`. Anything the device
   answers differently goes behind a port in `core/platform/ports.ts`.
2. **Views never reach past their ViewModel.** Nothing under `src/ui/` may import
   `@/core/stores/*`, `@/core/data/*` or `@/core/money/*` (`no-restricted-imports`). A view that
   needs a formatted peso amount gets the finished string from its ViewModel.

Quick manual check:

```bash
grep -rE "window\.|document\.|localStorage|sessionStorage|matchMedia|navigator\." src/core src/ui
```

## 5. The two seams (injected in `main.tsx`)

- **`core/platform/ports.ts` — the device seam.** `Platform` with eight ports: `storage`,
  `appearance`, `accessibility`, `appState`, `scroll`, `backGesture`, `clipboard`,
  `statementExport`. All async or push-based, because `AsyncStorage` and `AccessibilityInfo` are
  async on device. Consumed via `usePlatform()`; injected via `PlatformProvider`.
- **`core/platform/bankingGateway.ts` — the bank seam.** `BankingGateway` with six sub-ports
  (`accounts`, `activity`, `directory`, `payments`, `compliance`, `security`) plus
  `nextIdempotencyKey()`. Every call returns `GatewayResult`, never throws — the reason a payment
  failed must reach the screen. This interface is the future client↔backend contract
  (`docs/backend-architecture.md` §5.1). Consumed via `useBankingGateway()`.

## 6. How to add a screen

The most recent screen added is **`insights`** (monthly spending insights) — the steps below are
its actual footprint. Follow them in order:

1. **Add a key to `ScreenParams`** in `src/core/navigation/screens.ts` (params stay
   `undefined`). If the screen is a tab, instead add it to `TAB_ITEMS` (single source of truth)
   and to the `TabScreen` union.
2. **Add a ViewModel** `src/core/viewmodels/use<Name>ViewModel.ts`: read stores via selectors,
   call `useBankingGateway()` / `usePlatform()` as needed, compose `core/domain` derivations, and
   return render-ready data + named commands. Format money here. (`useSpendingInsightsViewModel.ts`
   derives everything from the activity feed via `buildMonthSpend` in
   `core/domain/spendingInsights.ts`.)
3. **Add the view** `src/ui/screens/<Name>Screen.tsx`: no props; read the ViewModel at the top;
   import nothing from `core/stores`, `core/data` or `core/money` (the ESLint fence will fail the
   build otherwise).
4. **Register it in the `SCREENS` map** in `src/App.tsx` — the only place ids meet components.
5. **If it holds resumable flow state** (must survive a tab switch), give it a store in
   `core/stores/` and register that store in `core/app/resetStores.ts` (also covers sign-out, which
   calls `resetStores()` — see `useProfileViewModel`).
6. **If it needs new styles**, add a CSS file and an `@import` in `src/styles/index.css` **before**
   the `dark.css`/`responsive.css` imports.
7. **Add a flow test** `src/test/<name>.flow.test.tsx` (copy the harness from
   `insights.flow.test.tsx` / `account.flow.test.tsx`): render `<App />` inside
   `BankingGatewayProvider` with `createMockNetBankGateway({ latencyMs: 0 })`.
8. Run `npm run verify`.

## 7. How to add a feature

The same pattern applies at every size — a **store** for state, a **ViewModel** to present it, a
**view** to render it:

1. **State → store.** Add a Zustand store (or extend one) following `preferences.store.ts`'s shape:
   state at the top, `actions` nested, singleton `xxxActions` export, no persistence middleware,
   no-op guards on idempotent writes. Register it in `core/app/resetStores.ts` so tests and
   sign-out start clean.
2. **Truth → the gateway.** If the feature touches money or bank data, extend
   `core/platform/bankingGateway.ts` (sub-port, `GatewayResult` return) and its mock in
   `src/platform/web/createMockNetBankGateway.ts`. The store stays a cache: after a money move,
   call `syncBalances(gateway)` from `core/app/syncBalances.ts` instead of computing locally.
3. **Presentation → ViewModel.** Compose the store selectors and domain derivations into
   render-ready data + named commands. All `formatMoney`/`formatSignedMoney`/`maskMoney` calls
   happen here and nowhere else.
4. **Rendering → view.** Bind the ViewModel; keep `ui/` free of domain enums, raw money, and store
   imports.
5. **Prove it.** Unit tests beside the domain/money logic; a flow test in `src/test/` if the
   feature is screen-visible; `npm run verify`.

## 8. Gotchas

- **The golden snapshot is sacred.** `src/test/app.flow.test.tsx` must stay green without
  `vitest -u`. If a change legitimately alters it, say so in the commit message.
- **`tsc -b` is strict about dead bindings** (`noUnusedLocals`/`noUnusedParameters`) — unused
  imports fail `verify`, not just the linter.
- **The quest ring's 41% is hardcoded in three places** — `progressPercent: 41` in
  `core/stores/quest.store.ts` and the `41%` stops in the `conic-gradient` in `styles/quest.css`
  and `styles/dark.css`. Deriving it from the amounts gives 41.33% in the label while the ring
  stays at 41. All stay literal until the gradient is driven by a CSS custom property.
- **The quiz answer is captured but never scored** — the result is always "The Free Spirit".
- **Dates are display strings** (`"Today, 8:23 AM"`); there are no `Date` objects.
- **Back buttons pop the stack (`goBack()`), except `Send money` and `Add money`**, whose back
  buttons navigate to an explicit destination (`home`) to preserve original behaviour — see the
  comment in `useMoneyMovementViewModel.ts`.
- **Known lint exemption:** `react-hooks/set-state-in-effect` is a warning, not an error, for the
  async data-refresh effects in `useActivityViewModel.ts` and `useSpendingInsightsViewModel.ts`.
  Prefer resolving over widening the exemption.
- **Stores leak between tests** unless reset — that is what `src/test/setup.ts`'s `resetStores()`
  is for; new stores must be registered there.
- **Screen count:** `ScreenParams` has 48 keys and `ui/screens/` has 48 components; the README and
  doc map track this number — keep them in sync when you add one.

## 9. Suggested reading order

1. `README.md` — what the prototype is, the deliberate shortcuts.
2. `docs/frontend-architecture.md` — the MVVM contract, the two seams, the RN port story.
3. This guide's §3 walkthrough, then read `src/main.tsx` → `src/App.tsx` →
   `src/core/navigation/screens.ts` in that order.
4. One screen end-to-end: `src/core/stores/wallet.store.ts` →
   `src/core/viewmodels/useHomeViewModel.ts` → `src/ui/screens/HomeScreen.tsx`.
5. `docs/backend-architecture.md` (draft) and `docs/multi-user-model.md` (decided) — where the
   mock is headed.
