# FIN-A Wallet — Frontend Architecture

Status: **current** — verified against `src/core`, `src/ui`, `src/platform/web` and `src/app` at
commit `87d4c89` (2026-08-13). This document describes the frontend as it actually is: a
Vite + React 19 + TypeScript + Zustand prototype with no backend. The planned NetBank backend is
designed in `backend-architecture.md` (draft, ALP-6) and `multi-user-model.md` (decided, ALP-7);
the seams this document describes are the ones those docs assume the backend will implement.

## 1. The split that matters: platform dependence

The top-level split is **not** by feature — it is by whether the code survives a React Native
port. The target is an RN port, so the organising question is "what would I have to rewrite?":

```
src/
  core/          Model + ViewModel. Survives the RN port verbatim. Nothing web-specific.
  ui/            Views only. Rewritten for RN (JSX mostly survives; styling does not).
  platform/web/  Web implementations of the platform ports. Deleted at the port.
  app/bridges/   Renderless web-only side effects. Replaced per platform.
  styles/        Global CSS by cascade layer. Deleted at the port except tokens.css.
  main.tsx       The web entry: builds the web Platform + mock gateway, renders App.
```

This is MVVM, and the layering rule is one-directional: `core` never imports `ui` except the
`Theme` type (`src/ui/theme/ThemeContext.tsx`, `import type` only), and `ui` never imports stores,
data, or money helpers — the ViewModel in between is the only bridge.

## 2. MVVM contract

- **Model** — everything true without a screen open: entities and pure derivations in
  `core/domain/`, integer-centavo money in `core/money/`, fixtures in `core/data/mock/`, and
  Zustand state in `core/stores/`.
- **ViewModel** — one `use*ViewModel` per screen in `core/viewmodels/` (26 of them), plus shared
  derivations (`useCardViews`, `useCardPrivacy`, `useReduceMotion`). A ViewModel reads stores,
  calls the gateway/platform ports, composes domain derivations, and returns **render-ready data
  plus named commands** (`pressCard`, `toggleBalance`, `selectTab`). Never raw store state.
- **View** — `src/ui/` components take **no props**; each screen reads its own ViewModel. Views
  render and forward events; they do not format money, branch on domain enums, or reach into
  stores.

Two consequences are machine-enforced by ESLint (`eslint.config.js`):

1. **No web globals outside the web edge.** `window`, `document`, `localStorage`,
   `sessionStorage`, `matchMedia`, `navigator` are banned (`no-restricted-globals`) everywhere
   except `src/platform/`, `src/app/bridges/`, `src/main.tsx` and `src/test/`. Anything the
   device answers differently goes behind a port in `core/platform/ports.ts`.
2. **Views never import `@/core/stores/*`, `@/core/data/*` or `@/core/money/*`**
   (`no-restricted-imports`, scoped to `src/ui/**`). A view that needs a formatted peso amount
   gets the finished string from its ViewModel.

## 3. Layer walkthrough

### 3.1 `core/money` — integer centavos

`Money = { amount, currency }` with `amount` always an integer minor unit (centavos for PHP).
Build with `pesos(24_680.5)` (→ `{ amount: 2468050, currency: "PHP" }`), never a float or a
display string; `money()` throws on non-safe integers. Arithmetic (`addMoney`, `subtractMoney`,
`compareMoney`, `ratio`) enforces currency equality. Formatting (`formatMoney`,
`formatSignedMoney`, `maskMoney`, `parseMoneyInput`) lives in `core/money/format.ts` and happens
**only at the ViewModel boundary**. The formatter is hand-rolled on purpose — U+2212 minus sign,
environment-independent snapshots, and Hermes' incomplete Intl — so it is not to be swapped for
`Intl.NumberFormat`.

### 3.2 `core/domain` — entities and pure logic

Type definitions and derivations with no I/O: `card.ts`, `account.ts`, `banking.ts` (the
bank-facing vocabulary that "intentionally avoids NetBank request shapes"), `paymentIntent.ts`
(including the `requiresStepUp` rule), `payments.ts`, `rails.ts`, `transaction.ts`,
`compliance.ts`, `security.ts`, `user.ts`, `notification.ts`, `quiz.ts`, `statement.ts`,
`request.ts`, `load.ts`, `spendingInsights.ts`, `progress.ts` (level/XP), `gatewayResult.ts`
(the closed `GatewayErrorCode` set + `isRetryable`), `icons.ts`, `qrMatrix.ts`, `mobile.ts`,
`simulation.ts`, and `ui`-adjacent helpers. Pure functions get unit tests beside them
(`*.test.ts`).

### 3.3 `core/data/mock` — fixtures

One fixture file per domain: `accounts.mock.ts`, `banks.mock.ts`, `cards.mock.ts`,
`compliance.mock.ts`, `notifications.mock.ts`, `payments.mock.ts`, `quiz.mock.ts`,
`security.mock.ts`, `user.mock.ts`. They are the "database" of the prototype; `README.md` lists
the deliberate shortcuts (e.g. the quiz always returns "The Free Spirit").

### 3.4 `core/stores` — Zustand singletons

21 domain stores (`accounts`, `activity`, `billerCatalog`, `bills`, `buyload`, `cashout`,
`deposit`, `jar`, `kyc`, `payment`, `preferences`, `qr`, `quest`, `recipients`, `requests`,
`settings`, `statement`, `transfer`, `ui`, `user`, `wallet`) plus `core/navigation/navigation.store.ts`.
Conventions:

- Mutators are nested under an `actions` object and exported as module singletons
  (`export const walletActions = useWalletStore.getState().actions`). Import actions directly;
  never select them — they are stable and add no subscription.
- No-op writes are guarded (`if (get().selectedCardId === id) return`) because equal writes still
  wake subscribers.
- **No persistence middleware.** Storage is synchronous on web and asynchronous on device, and the
  web build additionally needs DOM writes; both live in a bridge (`app/bridges/ThemeBridge`),
  keeping every store identical across platforms.
- Any new store must be registered in `core/app/resetStores.ts` so tests start clean.
- Balance stores are caches of the bank's answer: `wallet.store.ts` documents that balances are
  pushed in by the gateway, never computed locally, and `core/app/syncBalances.ts` re-reads them
  after money moves.

### 3.5 `core/navigation` — hand-rolled stack

`navigation/screens.ts` defines `ScreenParams` (48 screens), `Screen`, `TabScreen`, `TAB_ITEMS`
(the single source of truth for the tab bar) and `INITIAL_SCREEN`. `navigation.store.ts` keeps a
real stack (`navigate`, `goBack`, `switchTab`, `resetTo`); tabs are roots, not stack entries.
`useNavigation()` returns a contract deliberately shaped like React Navigation's
`useNavigation()` with the same method names, so migrating to React Navigation means rewriting
`useNavigation.ts`'s body and deleting `navigation.store.ts` — no ViewModel or view changes.
Route params stay empty on purpose: resumable flow state (the quest limit-setup step, the
statement month) lives in stores so it survives tab switches.

### 3.6 `core/platform` — the two seams

**`ports.ts` — the device seam.** `Platform` with eight ports, all async or push-based even where
the web could answer synchronously (AsyncStorage and AccessibilityInfo are async on device, so
the shape is fixed now): `storage`, `appearance`, `accessibility`, `appState`, `scroll`,
`backGesture`, `clipboard`, `statementExport`. Method names mirror React Native's APIs, not the
DOM's, so the temporary (web) adapter does the awkward translation and the native adapter is a
thin passthrough. Injected through `PlatformProvider` (`PlatformContext.tsx`, default
`noopPlatform`); consumed via `usePlatform()`.

**`bankingGateway.ts` — the bank seam.** `BankingGateway` with six sub-ports (`accounts`,
`activity`, `directory`, `payments`, `compliance`, `security`) plus `nextIdempotencyKey()`. Every
call returns `GatewayResult`, never throws — the reason a payment failed must reach the screen.
`idempotencyKey` is minted once per flow and reused verbatim on retry, so a duplicate submit
returns the original receipt instead of paying twice. This interface is the client↔backend
contract: the future server implements it with a real NetBank adapter (see
`backend-architecture.md` §5.1). Injected through `BankingGatewayProvider`
(`BankingGatewayContext.tsx`, default `unavailableBankingGateway`).

### 3.7 `src/platform/web` and `src/app/bridges` — the web edge

- `platform/web/createWebPlatform.ts` — web implementations of all eight ports (localStorage via
  the async `StoragePort`, `prefers-color-scheme` / `prefers-reduced-motion` subscriptions, a
  fake back gesture from history, clipboard, `<a download>` CSV save).
- `platform/web/createMockNetBankGateway.ts` — the mock gateway with simulated latency
  (`latencyMs: 450` in `main.tsx`; tests default it to 0 for determinism) and a seeded KYC
  rejection so the resubmission path is reachable.
- `app/bridges/ThemeBridge.tsx` — renders null; reads/writes the theme through the storage port
  and paints `documentElement.dataset.theme` after hydration (the pre-paint inline script in
  `index.html` handles first paint). `app/bridges/useFocusTrap.ts` is the a11y focus trap.
- `main.tsx` — builds both, wraps `<App/>` in `BankingGatewayProvider` + `PlatformProvider`, and
  is the only place the web implementations are chosen. An RN entry would build a native
  Platform and render the same `App`.

### 3.8 `src/App.tsx` — the only id↔component map

The `SCREENS` record in `src/App.tsx` is the single place a `Screen` id meets its component.
Screens take no props; each reads its own ViewModel. `useAppShellViewModel` drives the shell
(active tab, action sheet, sign-out).

### 3.9 `src/styles`

Global CSS split by cascade layer; `styles/index.css` import order _is_ the cascade order
(`dark.css` and `responsive.css` must load last). Only `tokens.css` survives the RN port.

## 4. Adding a screen

1. **Add an entry to `ScreenParams`** in `core/navigation/screens.ts` (params stay `undefined`;
   flow state goes in a store).
2. **Add a ViewModel** `use<Name>ViewModel.ts` in `core/viewmodels/` that reads stores, calls
   `useBankingGateway()` / `usePlatform()` as needed, and returns render-ready data + named
   commands. Format money here.
3. **Add the view** `src/ui/screens/<Name>Screen.tsx`: no props, reads its own ViewModel, imports
   nothing from `core/stores`, `core/data` or `core/money`.
4. **Register it in the `SCREENS` map** in `src/App.tsx` — the only place ids meet components.
5. If it is a tab, update `TAB_ITEMS` in `core/navigation/screens.ts` (single source of truth).
6. If it holds resumable state, give it a store and register the store in
   `core/app/resetStores.ts`.
7. Run `npm run verify` (typecheck → lint → format:check → test → build).

## 5. Testing

Vitest + Testing Library on jsdom. Unit tests sit beside their modules (`money.test.ts`,
`payments.test.ts`, …). `src/test/app.flow.test.tsx` is a **golden snapshot** — the proof that
the restructure preserved behaviour — so `vitest -u` is never run to clear a failure; a red
snapshot means rendering changed and must be explained. `src/test/setup.ts` resets the singleton
stores after each test and stubs `localStorage`, `matchMedia` (pinned to light) and `scrollTo`,
none of which exist in this jsdom/Node 26 combination.

Known lint exemptions: `react-hooks/set-state-in-effect` is `warn` for the async data-refresh
effects in `useActivityViewModel.ts` and `useSpendingInsightsViewModel.ts`.

## 6. React Native port story

| Layer          | At the port                                                                       |
| -------------- | --------------------------------------------------------------------------------- |
| `core/**`      | Survives verbatim (this is the point of the split)                                |
| `src/ui/**`    | Rewritten for RN (JSX mostly carries over)                                        |
| `platform/web` | Replaced by native adapters of the same ports                                     |
| `app/bridges`  | Replaced per platform (e.g. theme → StyleSheet)                                   |
| `styles/`      | Only `tokens.css` survives                                                        |
| `main.tsx`     | A native entry builds a native Platform + real gateway and renders the same `App` |

## 7. Status notes

- `README.md`'s architecture section and this document agree; where they differ in detail, this
  document is the deeper one. The screen count in `README.md` ("47") is one behind
  `ScreenParams` (48) as of `87d4c89` — flagging so the doc-map refresh (ALP-34) can correct it.
- Backend mapping of every port listed here lives in `backend-architecture.md` §5.1.
