# FIN-A Wallet — Data & API Layer

Status: **current** — verified against `src/core/data`, `src/core/stores`, `src/core/money`,
`src/core/platform` and `src/platform/web` at commit `7e332c9` (2026-08-13, ALP-34). This document
describes the prototype's data/API surface as it actually is — the fixtures, the store contracts,
the money type, and the gateway seam a future NetBank backend implements (designed in
`backend-architecture.md`, draft ALP-6, and `multi-user-model.md`, decided ALP-7).

## 1. What "data layer" means here — and what it does not

The draft architecture docs spoke of "repositories". That layer does **not** exist as separate
classes: there is no `Repository` interface, no repository implementations, and no ORM. What the
prototype actually has is four cooperating pieces:

| Piece        | Location                                       | Role                                                           |
| ------------ | ---------------------------------------------- | -------------------------------------------------------------- |
| Fixtures     | `src/core/data/mock/*.mock.ts` (9 files)       | The content: frozen, deterministic seed data                   |
| API contract | `src/core/platform/bankingGateway.ts`          | The shape a real backend must implement                        |
| Mock adapter | `src/platform/web/createMockNetBankGateway.ts` | The behavior: an in-memory "NetBank" that answers the contract |
| Client state | `src/core/stores/*.store.ts` (21 stores)       | Caches and drafts; the gateway owns the truth                  |

The data flow is one-directional and goes through the gateway, never around it:

```
ViewModel ──call──▶ BankingGateway ──▶ mock adapter (today) / NetBank API (later)
                      │
                      ▼
                GatewayResult<T>          ← ok/failed, never throws
                      │
                      ▼
                store cache (Zustand)     ← wallet.setBalances, payment.store, …
                      │
                      ▼
                render-ready ViewModel state
```

A ViewModel is the **only** caller of the gateway (`useBankingGateway()` from
`core/platform/BankingGatewayContext.tsx`). Views never touch data, stores or money helpers
(ESLint `no-restricted-imports`, scoped to `src/ui/**`).

## 2. `core/money` — the currency of every amount

`Money = { amount: number; currency: CurrencyCode }` with `amount` **always an integer minor unit**
— centavos for PHP. No float, no display string: floats invite rounding drift and strings make
arithmetic impossible (`src/core/money/money.ts`).

- `money(amount)` — throws `TypeError` unless `Number.isSafeInteger(amount)`.
- `pesos(24_680.5)` — authoring helper; `{ amount: 2468050, currency: "PHP" }`. Fixtures use this.
- Arithmetic is a small closed set: `addMoney`, `subtractMoney`, `compareMoney`, `isNegative`,
  `isZero`, `ratio` (fraction of `whole`, 0 when whole is zero). All assert same currency and
  throw on mismatch.
- `CurrencyCode` is a single-member union (`"PHP"`) today; `CURRENCIES` carries the metadata
  (`symbol: "₱"`, `minorUnits: 2`).

Formatting lives in `src/core/money/format.ts` and happens **only at the ViewModel boundary**:
`formatMoney` (hand-rolled, U+2212 minus sign, options for symbol/grouping/fractionDigits/sign),
`formatSignedMoney` ("+₱2,000.00" / "−₱160.00"), `maskMoney` ("₱••,•••.••"), and `parseMoneyInput`
(returns `null` while the input is not yet a valid amount). The formatter is deliberately not
`Intl.NumberFormat` — see the comment in that file (snapshot stability, Hermes Intl gaps).

## 3. `core/data/mock` — the fixtures

Nine files under `src/core/data/mock/`. All amounts are built with `pesos()`; nothing is a float.

| File                    | Seeds                                                                                                                                                                                                                                                                                                                                                | Key facts (verified)                                                                                                                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cards.mock.ts`         | `MOCK_CARDS` — the two card faces: **main** (last4 `8421`, ₱24,680.50, teal) and **travel** (last4 `1198`, ₱8,450, sunset, artwork `sunset-jeepney`); `INITIAL_FROZEN`; `MOCK_CARDHOLDER`                                                                                                                                                            | The **card** is the thing the user recognises; the **account** is the rail-creditable number behind it (see `accounts.mock.ts`)                                                                                                                        |
| `accounts.mock.ts`      | `MOCK_ACCOUNTS` — two `BankAccount`s (`acct-main`, `acct-travel`), both `MAYA SANTOS` at `NetBank (A Rural Bank), Inc.`, balances mirroring the cards; `MOCK_VIRTUAL_ACCOUNT` (account `009123456789`, rails `instapay` + `pesonet`, cash-in instructions); `MOCK_QR_INSTRUCTIONS`                                                                   | The virtual account is the **only way money enters the wallet from outside**. QR fixtures: Daily Brew (fixed ₱185) and Sari Maria (open amount)                                                                                                        |
| `banks.mock.ts`         | `MOCK_BANKS` — 8 banks: FIN-A (`internal`), BDO/BPI/MBTC/LBP/UBP (`instapay` + `pesonet`), GCASH/SEAB (`instapay`); `findBank`; `RAIL_PRICING`                                                                                                                                                                                                       | `BankCode` is a plain string, not a union — the list comes from the provider at runtime. Pricing: internal ₱0; InstaPay ₱15, capped ₱50,000/transfer; PESONet ₱25, 3:00 PM cut-off                                                                     |
| `payments.mock.ts`      | `MOCK_TRANSACTIONS` (3), `MOCK_SCHEDULED_PAYMENTS` (2), `MOCK_AUTOPAY` (2, `active`), `MOCK_AMOUNT_PRESETS` (₱500/1,000/2,500), `MOCK_LOAD_PRESETS` (₱50–1,000), `MOCK_LOAD_OPERATORS` (Smart/Globe/DITO with prefix slices), `MOCK_CASHOUT_ACCOUNTS` (3), `MOCK_RECIPIENTS` (4, all FIN-A wallets), `MOCK_DEPOSIT_METHODS` (4), `MOCK_BILLERS` (10) | Recipients' `handle` is stored, not derived — bank accounts mask to "•••• 4471", mobile wallets show their prefix. Deposit methods carry their own fee/arrival copy (partner-owned)                                                                    |
| `compliance.mock.ts`    | `INITIAL_KYC_STATUS` (tier `verified`, state `approved`, "Approved Jul 2, 2026"); `limitsForTier(tier)`; `MOCK_STATEMENTS` (July 2026: 12 rows; June: 12; May: 14; **April: deliberately empty**)                                                                                                                                                    | The wallet starts _verified_, not _full_ — so PESONet stays gated and `kyc-required` is a reachable failure. Statement closing balances and transaction counts are **derived** by `buildStatement` (`core/domain/statement.ts`), never hand-maintained |
| `user.mock.ts`          | `MOCK_USER` — Maya Santos, `+63 917 555 2288`, `maya.santos@example.ph`, active                                                                                                                                                                                                                                                                      | Cross-fixture agreements below are documented in this file's comment                                                                                                                                                                                   |
| `notifications.mock.ts` | `MOCK_NOTIFICATIONS` — 4, kinds `payment`/`quest`/`security`/`system`                                                                                                                                                                                                                                                                                | `transactionId: "money-received"` resolves against `MOCK_TRANSACTIONS`                                                                                                                                                                                 |
| `security.mock.ts`      | `MOCK_TRANSACTION_PIN` `"246810"`, `MOCK_MPIN` `"271828"`, `MOCK_OTP_CODE` `"135790"`, `MOCK_OTP_DESTINATION` `"0917 ••• 2288"`, `MPIN_ATTEMPT_LIMIT` `3`, `MOCK_SESSIONS` (2)                                                                                                                                                                       | Fixed credentials on purpose — a prototype nobody can get into is not a prototype. Both are shown as hints on the screens that ask                                                                                                                     |
| `quiz.mock.ts`          | `MOCK_MONEY_STYLE` — always "The Free Spirit"; `MOCK_QUIZ_QUESTION`                                                                                                                                                                                                                                                                                  | The quiz answer is captured but **never scored** (README's shortcut list)                                                                                                                                                                              |

**Cross-fixture agreements** (each documented in a fixture comment; treat them as invariants):

1. Card balances == account balances (`accounts.mock.ts` reads `MOCK_CARDS[i].balance`).
2. `MOCK_USER.fullName` == `MOCK_CARDHOLDER.name` == the account `accountName` — one human.
3. The OTP destination's last four (`2288`) matches the user's mobile — the code is plausibly
   sent to _this_ user.
4. Notification `transactionId`s resolve to `MOCK_TRANSACTIONS`.
5. Statement counterparties mirror the activity fixtures, so the export reads like the same
   wallet's history. The simulated timeline is fixed: `DEFAULT_TODAY_ISO = "2026-08-11"`
   (`createMockNetBankGateway.ts`) — "Today, 8:23 AM" in the fixtures is that date.
6. The travel card's balance lives in its account, and **not** in the savings jar — the jar is a
   separate balance that starts `{ opened: false, balance: ₱0 }` (see §6).

## 4. `core/stores` — the client-side contracts

21 Zustand stores in `src/core/stores/`, all following one shape:

- state + nested `actions` object;
- `INITIAL_*` constant per store (the reset target);
- a module-singleton action export (`export const walletActions = useWalletStore.getState().actions`);
- no-op write guards (`if (get().selectedCardId === id) return`) because equal writes still wake
  subscribers;
- reset through `src/core/app/resetStores.ts`, which restores **all** stores (plus navigation) —
  called by the test setup and by sign-out.

Three roles, by how a store gets its data:

1. **Drafts and UI state — no gateway, no fixtures** (`activity`, `billerCatalog`, `buyload`,
   `cashout`, `deposit`, `jar`, `kyc`, `payment`, `preferences`, `qr`, `quest`, `request`,
   `statement`, `transfer`, `ui`). They hold what a screen is composing — e.g.
   `transfer.store.ts` keeps the draft for all three send paths (saved recipient, bank account,
   mobile number), invalidating the verified name whenever the destination changes.
2. **Caches of gateway answers** — the wallet store is the canonical example:
   `walletActions.setBalances(...)` and `setJarState(...)` push the bank's answer in; the store
   never does balance arithmetic itself. The comment is explicit: _"a cache of the bank's answer
   rather than a second ledger that could disagree"_ (`src/core/stores/wallet.store.ts`).
   `payment.store.ts` caches the in-flight flow (intent, quote, idempotency key, confirmation,
   receipt) so a half-finished payment survives a tab switch; the idempotency key is minted once
   and reused verbatim on retry.
3. **Seeded from fixtures, then mutated client-side** — `accounts` (`MOCK_ACCOUNTS` →
   linked accounts), `bills` (`MOCK_AUTOPAY` → enrollments), `recipients` (`MOCK_RECIPIENTS`),
   `settings` (`MOCK_NOTIFICATIONS` + `DEFAULT_NOTIFICATION_PREFERENCES`), `user` (`MOCK_USER`),
   `wallet` (`MOCK_CARDS`). The seeded value is the initial state; mutations (mark read, add
   recipient, rename) are plain `set` calls — the _gateway_ is not consulted for these because
   the prototype has nowhere to persist them (a real adapter would verify a link with a
   micro-deposit or OTP — simulated by accepting the entry outright, per the `accounts.store.ts`
   comment).

Views never import stores (`no-restricted-imports` in `eslint.config.js`); ViewModels select from
them.

## 5. The gateway contract — `core/platform/bankingGateway.ts`

The seam a future server-side NetBank adapter implements. The browser never talks to a bank
directly; the prototype injects a local mock at startup (`src/main.tsx`). The contract has two
hard rules, both documented at the top of the file:

1. **Every call returns `GatewayResult<T>`, never throws.** The reason a payment failed has to
   reach the screen. `GatewayResult<T> = { ok: true; value: T } | { ok: false; error: GatewayError }`
   (`core/domain/gatewayResult.ts`) with a closed set of 10 `GatewayErrorCode`s:
   `insufficient-funds`, `limit-exceeded`, `invalid-account`, `rail-unavailable`,
   `rail-cutoff-passed`, `kyc-required`, `confirmation-required`, `duplicate-request`, `not-found`,
   `network`. The adapter owns the human `message`; `isRetryable(error)` is true only for
   `network` and `rail-unavailable`.
2. **Sub-ports, not eighteen flat methods** — the same grouping `Platform` uses in `ports.ts`.

```
BankingGateway
├── auth        lookupMobile(mobile) · startSignUp(mobile) · completeSignUp(input)
│               · signIn(input) · resetPin(input) · signOut() · resume(token)
├── accounts    list() · virtualAccount(accountId) · statements()
├── activity    list(query?) · get(id) · dispute(id, reason)
├── directory   banks() · verifyAccountName(bankCode, accountNumber)
│               · lookupMobileName(phoneNumber) · billers() · validateBillAccount(billerId, accountNumber)
├── payments    quote(intent) · submit(intent, idempotencyKey, confirmation)
│               · status(id) · openJar() · jarState()
│               · createInboundQr(request) · decodeQr(payload)
├── compliance  kycStatus() · submitKyc(submission) · limits()
├── security    requestOtp(purpose) · verifyOtp(purpose, code) · verifyPin(pin)
│               · sessions() · revokeSession(id)
└── nextIdempotencyKey()   — fresh key for the next payments.submit
```

`payments.submit` takes a `PaymentIntent` — a discriminated union of nine kinds (`transfer`,
`cash-in`, `bill`, `qr`, `cash-out`, `buyload`, `request`, `jar-in`, `jar-out`;
`core/domain/paymentIntent.ts`) — plus an idempotency key from `nextIdempotencyKey()` (deliberately
on the gateway, because `crypto.randomUUID()` is a banned web global and a caller-side counter
cannot survive a reload) and a `ConfirmationToken`. Replaying a key returns the original receipt
instead of moving money twice. `quote` has no side effects; `submit` executes; `status` polls a
pending transaction until it clears, fails, or is returned.

This contract **replaces** the original three-method surface (`listActivity`, `getTransaction`,
`createTransfer`), which was not executable by a real adapter — the old `Recipient` carried only a
masked display handle, so there was no account number, bank code, rail, or idempotency key to send.

## 6. The mock adapter — `src/platform/web/createMockNetBankGateway.ts`

`createMockNetBankGateway(options): BankingGateway` is an in-memory, NetBank-shaped adapter. Its
own doc comment says it plainly: _"Replace this only in a server-side composition root when
authenticated API access is available."_ It is web-only on purpose — a future RN build would
inject a different implementation of the same contract.

Behavior worth knowing (all verified):

- It **holds the balances itself** rather than reading the wallet store — the bank is what actually
  knows them — which is why `insufficient-funds` is a real answer here and could not be before.
- **Idempotency**: a `Map<idempotencyKey, PaymentReceipt>` — replay returns the original receipt.
  Confirmation tokens are tracked in a `Set` so a spent token cannot be replayed.
- **Settling**: a transfer goes `pending` and clears after `settleAfterPolls` (default 2) polls;
  account numbers ending in `MOCK_RETURNING_SUFFIX = "9999"` are accepted by the rail and then
  returned by the beneficiary bank — the PESONet return path, the reason `TransactionStatus` has a
  `returned` member.
- **Deterministic**: no `Math.random()`; anything that needs to look arbitrary is derived from the
  input (a digit-sum). The simulated "today" is `todayIso` (default `2026-08-11`) so receipts date
  deterministically.
- **Reference numbers**: per-kind prefixes (`NBK-TRF`, `NBK-CSH`, `NBK-WDR`, `NBK-BIL`, `NBK-QRP`,
  `NBK-LOD`, `NBK-RQS`, `NBK-JIN`, `NBK-JOT`) with running counters.
- **Injected options** (`MockGatewayOptions`): `latencyMs` (0 by default so tests are not races;
  `main.tsx` passes **450** so the dev server actually shows the loading/error states the screens
  render), `failures` (force one call to fail with a code, for unhappy-path tests), `kycTier`,
  `kycRejection` (seed a rejected submission — `main.tsx` seeds one: selfie too dark, step 3),
  `settleAfterPolls`, `seedActivity`, `todayIso`.

`src/main.tsx` is the composition root: it builds `createWebPlatform()` (the device seam, `ports.ts`)
and `createMockNetBankGateway({ latencyMs: 450, kycRejection: {...} })`, then injects both through
`BankingGatewayProvider` → `PlatformProvider` → `<App />`. The mock gateway is exercised by
`src/platform/web/createMockNetBankGateway.test.ts` (17 tests) and by the flow tests under
`src/test/`.

## 7. The NetBank replacement path

Replacing the mock means implementing the `BankingGateway` contract against authenticated NetBank
APIs **in a server-side composition root** and swapping the `createMockNetBankGateway(...)` call in
that root — no ViewModel, store, or fixture changes. The mapping of each sub-port to the NetBank
surface is designed in `docs/backend-architecture.md` §5.1 (product mapping) and §5.2–5.3
(webhooks/reconciliation, idempotency), including:

- `directory.lookupMobileName` → internal FIN-A directory (GAP-04 send-to-mobile);
- `payments.openJar` / `jarState` → A2A moves to/from a separate balance (GAP-07); the jar's
  balance is the bank's answer, cached in `wallet.store.jar`;
- idempotency keys map to NetBank's own idempotency surface so retries never double-pay.

Three disciplines the replacement must keep (they are load-bearing in the current code):

1. **The two-ledger rule** — balances are the bank's answer. `core/app/syncBalances.ts` re-reads
   `accounts.list()` + `payments.jarState()` after every money move and pushes results into the
   wallet store (`walletActions.setBalances` / `setJarState`). Failures are swallowed on purpose: a
   stale balance is cosmetic and the payment already succeeded.
2. **`GatewayResult`, never throws** — the adapter owns error copy; a ViewModel branches on the
   closed `GatewayErrorCode` set.
3. **Fixtures stay fixtures** — `core/data/mock/` seeds initial state and test scenarios; a real
   backend replaces the _gateway_, not the store seeds. The store contract (cache discipline,
   no-op guards, `resetStores`) is what makes that swap safe.

Device-side ports (`core/platform/ports.ts`) are a separate seam — storage, appearance, app-state,
clipboard, statement export — and change with the React Native port, not with the backend.
