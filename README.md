# FIN-A Wallet

A personality-powered e-wallet prototype for the Philippine market — pesos, quests, XP, and a
"money style" quiz. Vite + React 19 + TypeScript. All financial actions are simulated; there is
no backend.

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
    stores/      Zustand: preferences, wallet, quest, ui, payment, transfer,
                 kyc, activity, bills, qr, recipients, settings, deposit
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
grep -rE "window\.|document\.|localStorage|sessionStorage|matchMedia|navigator\." src/core src/ui   # expect no matches
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
whole restructure did not change what the app renders. The screen map has since grown to 39
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
- **Level progress reads 75% on Home and Profile but 76% on Reward.** Present before the
  restructure; left alone because it plausibly reflects XP just earned.
- **Back buttons now pop the stack (`goBack()`), except the money-entry screens**
  (`Send money`, `Add money`, `Fund wallet`), whose back buttons still navigate to an explicit
  destination to preserve the original behaviour — see the comment in
  `useMoneyMovementViewModel.ts`.
