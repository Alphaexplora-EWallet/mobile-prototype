# Changelog

All notable changes to FIN-A Wallet, the simulated Philippine e-wallet prototype (Vite + React 19 +
TypeScript, no backend yet).

This changelog is derived from the git history of `main` — every entry maps to a commit that is
actually on `main` as of 2026-08-13 (`cdf4366`), so it reflects what really shipped. Commit messages
follow Conventional Commits; entries cite their short commit hash and, where one exists, the
GAP/ALP issue reference.

The prototype has no tagged releases yet; `package.json` still reads `0.1.0`, so everything below
lives under **Unreleased**.

## Unreleased

### Added

- **Cash-out / withdraw to bank** — withdraw funds from a card to a linked bank account
  (`179f85b`, GAP-01).
- **Buy load / mobile top-up** — prepaid load purchase for a mobile number (`2c47167`, GAP-02).
- **Request money** — request payment from a peer (`b88cbac`, GAP-03).
- **Send to mobile** — send money to a mobile number or another FIN-A wallet (`5331921`, GAP-04).
- **Monthly statement CSV export** — export a real, per-month statement as CSV through a new
  `statementExport` port (`054e2b4`, GAP-05).
- **Spending insights** — monthly breakdown by category and merchant, driven by `core/domain/spendingInsights.ts`
  (`93286aa`, GAP-06).
- **Savings jar** — a separate savings balance with its own ledger, synced via
  `core/app/syncBalances.ts` (`894aab3`, GAP-07).
- **Biller catalog** — searchable biller catalog with favorites and more categories (`900960d`, GAP-08).
- **Linked bank accounts** — manage the bank accounts a wallet links for withdrawals and funding
  (`e3e259f`, GAP-09).
- **KYC resubmission** — resubmit KYC capture after a rejection (`ab5ec1e`, GAP-10).
- **Profile, personal details, and notification preferences** — new `ProfileScreen`,
  `PersonalDetailsScreen`, and `NotificationsScreen`, plus the `user` domain/store they sit on
  (`87d4c89`).
- **One-time-code sign-in** — the sign-in form now runs a real OTP challenge through the banking
  gateway (`security.requestOtp`) instead of ignoring the credentials (`217d137`).
- **Design refresh** — payment cards rebuilt as a flippable deck (`CardDeck`/`CardFlipper` replacing
  the single `PaymentCard`), redesigned Home and Wallet screens, new design tokens, and a `DESIGN.md`
  visual guide (`e218be4`, `aa74d65`).

### Changed

- **MVVM restructure** — the single-file `App.tsx` was split into `core/` (domain, data, stores,
  navigation, platform ports, viewmodels), `ui/` (screens and primitives), `platform/web`, and
  `app/bridges`; the golden snapshot in `src/test/app.flow.test.tsx` proves behaviour was preserved
  (`1397ab5`, `fb1a011`, `7acf865`, `c912697`, `18fd21a`, `217d137`).
- **Zustand stores + one ViewModel per screen** — state moved into 21 module-singleton Zustand
  stores; screens consume a `use*ViewModel` instead of stores or mock data directly
  (`18fd21a`, `217d137`).
- **Web APIs behind platform ports** — `window`, `document`, `localStorage`, `matchMedia` and
  `navigator` are banned outside `platform/` and `app/bridges/` and reachable only through the async
  `Platform` ports (`c912697`, `217d137`).
- **Money as integer centavos** — amounts are stored as `{ amount, currency }` centavos and formatted
  only at the ViewModel boundary (hand-rolled formatter, U+2212 minus) (`0d6ee1c`).
- **CSS by cascade layer** — `styles.css` split into cascade layers per screen, with `dark.css` and
  `responsive.css` last (`06154a0`, `22bef74`).
- **Consistent level/XP** — level and progress are derived from a single `xpTotal` through
  `levelFromXp` in `core/domain/progress.ts`; the 75% vs 76% Home/Reward discrepancy is gone, and
  finishing a quest now pays the XP out (`87d4c89`).

### Fixed

- **Accessibility (Stage 1-2 audit)** — focus management (new `useFocusTrap` bridge), contrast, and
  heading fixes across screens and overlays (`40780af`).

### Internal

- **Tooling** — Vite + React 19 + TypeScript scaffold, ESLint with the two architectural invariants,
  Prettier, Vitest/Testing Library/jsdom, and the golden DOM snapshot test
  (`1397ab5`, `89a746f`, `06154a0`).
- **Docs** — `README.md` architecture overview (`f44f58c`, `531ac7a`), `docs/backend-architecture.md`
  (Draft, ALP-6, `b31452c`), `docs/multi-user-model.md` (Decided, ALP-7, `f0c918e`), repo ignore
  rules for agent tooling (ALP-8, `5134a80`), refreshed doc set (`5b17652`), refreshed backend docs +
  new `docs/frontend-architecture.md` (ALP-34, `bed2a4b`), and this changelog plus the doc map in
  `docs/README.md` (ALP-34, `cdf4366`).

### Not on `main` (excluded on purpose)

- The sign-up / registration flow (`e92551b` "feat: registration flow" and its follow-ups) lives only
  on the `agent/technical-architect` branch; it has not been merged to `main` and is therefore not
  listed above.
- Two stashes (`36f91cc`, `17b0e45`) hold unmerged buy-load/design work; nothing from them is in
  `main`.
