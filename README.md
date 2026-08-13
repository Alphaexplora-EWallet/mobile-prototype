# FIN-A Wallet

A personality-powered e-wallet prototype for the Philippine market — pesos, quests, XP, and a
"money style" quiz. Vite + React 19 + TypeScript. All financial actions are simulated; there is
no backend today — `docs/backend-architecture.md` (draft, ALP-6) and `docs/multi-user-model.md`
(decision, ALP-7) design the NetBank-based backend that will eventually replace the mock.

## Docs

| File                            | Status               | Content                                                                                 |
| ------------------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `README.md` (this file)         | Current              | What the prototype is, how to run it, architecture overview                             |
| `docs/README.md`                | Current              | Documentation map: every doc, its status, and its owner                                 |
| `docs/backend-architecture.md`  | Draft (ALP-6)        | The planned backend: schemas, NetBank BaaS mapping, migration path                      |
| `docs/multi-user-model.md`      | Decided (ALP-7)      | How FIN-A users map to NetBank accounts (the decision behind ALP-6)                     |
| `docs/frontend-architecture.md` | Current              | The frontend as it is: MVVM, platform-seam layering, navigation, tests                  |
| `docs/data-layer.md`            | Current (ALP-34)     | Data/API surface: mock fixtures, store contracts, money, gateway contract, NetBank path |
| `docs/developer-guide.md`       | Current (ALP-34)     | Setup, structure walkthrough, how to add a screen/feature                               |
| `CHANGELOG.md`                  | Current (ALP-34)     | What shipped, from git history                                                          |
| `DESIGN.md`                     | Current (stale name) | UI layout & visual design guide (still says "EasyPay"; see doc map)                     |
| `AGENTS.md` / `CLAUDE.md`       | Current              | Working guidelines for agents / Claude Code                                             |

```bash
npm install
npm run dev        # http://localhost:5173
npm run verify     # typecheck + lint + format + test + build — run this before committing
```

| Script                      | What it does                                        |
| --------------------------- | --------------------------------------------------- |
| `dev` / `build` / `preview` | Vite                                                |
| `typecheck`                 | `tsc -b`                                            |
| `lint` / `lint:fix`         | ESLint, including the two architectural rules below |
| `format` / `format:check`   | Prettier                                            |
| `test` / `test:watch`       | Vitest                                              |
| `verify`                    | All of the above, in order                          |

## Architecture

The app is MVVM, and the top-level split is by **platform dependence** rather than by feature —
because the target is a React Native port, and the thing that matters is which code survives it.

```
src/
  core/        Model + ViewModel. Survives the RN port verbatim.
    money/       Money type, arithmetic, formatting
    domain/      Entities and pure derivations (deriveCardViews, isIncoming, …)
    data/        Repositories and mock fixtures
    stores/      Zustand: accounts, activity, billerCatalog, bills, buyload,
                 cashout, deposit, jar, kyc, payment, preferences, qr, quest,
                 recipients, requests, settings, statement, transfer, ui, wallet
    navigation/  Screen map, navigation stack, useNavigation()
    platform/    Port interfaces — the seam to the device
    viewmodels/  One use*ViewModel per screen
    app/         Web-free app logic (resetStores, syncBalances)
  ui/          View. Rewritten for RN.
    primitives/ layout/ cards/ money/ overlays/ screens/ theme/ assets/
  platform/web/  Web implementations of the ports
  app/bridges/   Web-only side effects (theme → DOM). Render nothing.
  styles/        Global CSS, split by cascade layer. Deleted at the RN port
                 except tokens.css.
```

**Model** is everything true without a screen open. **ViewModels** read stores, compose domain
logic, and return render-ready data plus named commands. **Views** render and nothing else.

### Two invariants, both machine-enforced

1. **No web APIs outside `platform/` and `app/bridges/`.** `window`, `document`, `localStorage`,
   `sessionStorage`, `matchMedia` and `navigator` are banned everywhere else by ESLint
   `no-restricted-globals` (the config exempts only `src/platform/`, `src/app/bridges/`,
   `src/main.tsx` and `src/test/`).
   Anything the device answers differently goes behind a port in `core/platform/ports.ts`.
   Ports are async and push-based even where the web could answer synchronously, because
   `AsyncStorage` and `AccessibilityInfo` are async on device.

2. **Views never reach past their ViewModel.** Nothing under `ui/` may import `core/stores`,
   `core/data` or `core/money` — enforced by ESLint `no-restricted-imports`. If a view needs a
   formatted peso amount, the ViewModel supplies the string.

Verify both with `npm run lint`, or directly:

```bash
grep -rE "window\.|document\.|localStorage|sessionStorage|matchMedia|navigator\." src/core src/ui   # expect no matches in code (comment mentions aside)
```

### Money

Amounts are integer centavos, never floats and never display strings:

```ts
pesos(24_680.5); // { amount: 2468050, currency: "PHP" }
formatMoney(card.balance); // "₱24,680.50"
formatMoney(quest.limit, { fractionDigits: 0 }); // "₱3,000"
formatSignedMoney(transaction.amount); // "−₱160.00"  (U+2212, not "-")
maskMoney(card.balance); // "₱••,•••.••"
parseMoneyInput("1,000"); // { amount: 100000, … }
```

Formatting happens **only** at the ViewModel boundary. The formatter is deliberately hand-rolled
rather than `Intl.NumberFormat` — see the comment in `core/money/format.ts` for why.

### Testing

`src/test/app.flow.test.tsx` is a **golden snapshot** of the app's whole journey — 15 snapshot
stops covering onboarding, the full quest flow, the money screens, and all five tabs — captured
against the original single-file version before the restructure began. It is the proof that the
whole restructure did not change what the app renders. The screen map has since grown to 48
screens (`ScreenParams` in `core/navigation/screens.ts`); the golden test is a representative
walk, not an exhaustive one.

> **Do not run `vitest -u` to make it pass.** A red snapshot means behaviour changed. Regenerating
> it discards the only evidence that it did not. If a change is genuinely intended, say so in the
> commit message.

Stores are module singletons, so `src/test/setup.ts` resets them between tests and stubs
`localStorage`, `matchMedia` and `scrollTo`, none of which exist in this jsdom/Node combination.

## Known shortcuts

These are deliberate, and each would need a real decision before changing:

- **The quest ring's 41% is hardcoded in three places** — `progressPercent: 41` in
  `core/stores/quest.store.ts` (drives the ring's percentage label and the progress-track width)
  and the `41%` stops in the `conic-gradient` in both `styles/quest.css` and `styles/dark.css`.
  Deriving it from the amounts gives 41.33% in the label while the ring stays at 41. All stay
  literal until the gradient is driven by a CSS custom property.
- **The quiz answer is captured but never scored.** The result is always "The Free Spirit".
- **Dates are display strings** (`"Today, 8:23 AM"`). Introducing `Date` means timezone and locale
  requirements that do not exist for frozen fixtures.
- ~~**Level progress reads 75% on Home and Profile but 76% on Reward.**~~ Fixed. Level and
  progress are derived from one `xpTotal` in `core/stores/quest.store.ts` through
  `levelFromXp` in `core/domain/progress.ts`. The guess behind the old 76% turned out to be
  right — Reward does show XP just earned — so completing a quest now actually pays the XP
  out, and every bar in the app moves together.
- **Back buttons now pop the stack (`goBack()`), except `Send money` and `Add money`,**
  whose back buttons still navigate to an explicit destination (`home`) to preserve the
  original behaviour — see the comment in `useMoneyMovementViewModel.ts`. `Fund wallet`
  now pops the stack like the rest.
