# FIN-A Wallet — Backend Architecture & Database Schemas (Draft)

Status: **draft** (issue ALP-6), refreshed 2026-08-13 against current `src/core`. The repo is a
frontend-only prototype whose `BankingGateway` is an in-memory mock
(`platform/web/createMockNetBankGateway.ts`). This document is the first cut of the backend that
will replace the mock, built on NetBank as the Banking-as-a-Service custodian. Since the first cut,
the prototype has landed profile / personal details, an in-app notification feed, a savings jar,
send-to-mobile, request money, buy load, cash-out, spending insights, statement export, linked bank
accounts, and a biller catalog — §2 and §5.1 map those onto the backend contexts below.

## 0. TL;DR — decisions locked in

- **NetBank (netbank.ph) is the custodian.** Funds live in NetBank accounts. FIN-A never holds,
  moves, or reconciles money outside NetBank's core. NetBank products used: Account-as-a-Service
  (per-user accounts), Virtual Collection Accounts (inbound funding), Disburse-to-Account
  (InstaPay / PESONet), Bills Payment, QRPH, and the KYC/onboarding API.
- **One NetBank account per wallet, not a shared account with internal division.** Users map to
  NetBank customer records, wallets to NetBank savings accounts. See `multi-user-model.md` (ALP-7).
- **Our database holds records, never authoritative balances.** The prototype already states this
  rule (`src/core/stores/wallet.store.ts`): "the wallet is a cache of the bank's answer rather than
  a second ledger that could disagree." The backend keeps the same invariant — balances always come
  from NetBank; our tables store intents, confirmations, and the activity feed.
- **Modular monolith, one Postgres, five schemas.** Five bounded contexts — `identity`, `wallet`,
  `payments`, `engagement`, `notification` — each with its own schema, its own DB role, and no
  cross-schema foreign keys. Schema isolation now; per-service deployment later (see §9).
- **The prototype's `BankingGateway` interface becomes the client↔backend contract.** The server
  implements `accounts`, `activity`, `directory`, `payments`, `compliance`, and `security` ports
  with a real NetBank adapter. `banking.ts` already says the vocabulary "intentionally avoids
  NetBank request shapes: a server-side adapter can translate this stable contract" — the backend
  _is_ that adapter.
- **Money is integer centavos everywhere.** `BIGINT amount_minor` in the DB, mirroring
  `core/money` (`pesos(24_680.5)` → `2468050`). No floats, no `NUMERIC(18,2)`.

## 1. Context and guiding principles

FIN-A Wallet is a personality-powered Philippine e-wallet: pesos, cards ("Main wallet",
"Travel jar"), transfers, bill payments, QR pay, cash-in, a quest ring with XP, KYC tiers, and
transaction-level security — plus, since the first cut of this doc: a savings jar, send-to-mobile,
request money, buy load, cash-out to bank, monthly spending insights, statement CSV export, linked
bank accounts, a biller catalog, an in-app notification feed, and profile / personal details.
Every financial action is simulated today.

### 1.1 The two-ledger rule

There are exactly two ledgers in this system, and they are not peers:

| Ledger              | Owner   | Role                                                                    |
| ------------------- | ------- | ----------------------------------------------------------------------- |
| NetBank core ledger | NetBank | **Truth.** Balances, settlements, rail confirmations.                   |
| FIN-A records       | FIN-A   | **Evidence.** Intents, quotes, receipts, activity feed, quest progress. |

FIN-A records are derived from, and reconciled against, the NetBank ledger — never the other way.
This kills the classic e-wallet bug of a local balance that disagrees with the bank. The prototype
already operates this way in the client: `core/app/syncBalances.ts` re-reads balances from the
gateway after every money movement instead of subtracting locally, and `wallet.store.ts` documents
the rule ("the wallet is a cache of the bank's answer rather than a second ledger that could
disagree"). The backend keeps the same invariant server-side.

### 1.2 Non-negotiables

1. Idempotency on every money movement (client mints `idempotencyKey` once, reuses on retry; the
   DB enforces it — the prototype already does this in `payment.store.ts`).
2. Server-side enforcement of limits, KYC tiers, and step-up rules — never trust the client
   (`requiresStepUp` in `paymentIntent.ts` is re-implemented server-side).
3. `returned` is a first-class transaction status, distinct from `failed` (a real PESONet outcome).
4. Closed error vocabulary for the client — the `GatewayErrorCode` set
   (`insufficient-funds`, `limit-exceeded`, `invalid-account`, `rail-unavailable`,
   `rail-cutoff-passed`, `kyc-required`, `confirmation-required`, `duplicate-request`, `not-found`,
   `network`). NetBank errors are mapped to these, never leaked raw.
5. Correlation IDs (`x-correlation-id`) on every request and event, end to end.

## 2. Services / bounded contexts

Boundaries come from the prototype's domain files, not from team structure.

| Context        | Owns                                                                                                             | Prototype roots (current `src/core`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identity`     | Users, KYC submissions, device sessions, OTP challenges, transaction PIN, quiz result                            | `domain/compliance.ts`, `domain/security.ts`, `domain/user.ts`, `stores/kyc.store.ts`, `stores/user.store.ts`                                                                                                                                                                                                                                                                                                                                                                                       |
| `wallet`       | Wallets (card faces), balance cache, spending limits, savings jar, virtual accounts (VCAs), linked bank accounts | `domain/account.ts`, `domain/card.ts`, `stores/wallet.store.ts`, `stores/accounts.store.ts`, `stores/jar.store.ts`                                                                                                                                                                                                                                                                                                                                                                                  |
| `payments`     | Payment intents, activity feed, recipients, billers, autopay, statements, disputes, reconciliation               | `domain/banking.ts`, `domain/paymentIntent.ts`, `domain/payments.ts`, `domain/rails.ts`, `domain/transaction.ts`, `domain/statement.ts`, `domain/request.ts`, `domain/load.ts`, `stores/payment.store.ts`, `stores/activity.store.ts`, `stores/transfer.store.ts`, `stores/cashout.store.ts`, `stores/deposit.store.ts`, `stores/bills.store.ts`, `stores/billerCatalog.store.ts`, `stores/buyload.store.ts`, `stores/requests.store.ts`, `stores/recipients.store.ts`, `stores/statement.store.ts` |
| `engagement`   | Quests, XP, levels, reward style unlocks, quiz scoring                                                           | `stores/quest.store.ts`, `domain/quiz.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `notification` | In-app notification feed, notification preferences, push tokens                                                  | `domain/notification.ts`, `stores/settings.store.ts`, `data/mock/notifications.mock.ts`                                                                                                                                                                                                                                                                                                                                                                                                             |

The roots column names the files whose domain vocabulary defines the context. Per-session flow
stores (`transfer`, `cashout`, `deposit`, `bills`, `buyload`, `requests`, `qr`, `billerCatalog`,
`recipients`) hold client-side drafts and selections; when the backend lands they become server
calls, not tables. Note the prototype's `stores/preferences.store.ts` (theme, balance visibility)
is device/appearance state — it belongs to the client, not to any backend context.

Plus two shared infrastructure pieces: an **API Gateway / BFF** (the only thing the mobile/web
client talks to) and a **worker** (outbox relay, reconciliation job, autopay scheduler, quest
evaluation).

```
                    ┌───────────────────────────────────────────────┐
                    │  Mobile / Web app (existing prototype UI)     │
                    └───────────────────┬───────────────────────────┘
                                        │ HTTPS, user OAuth2 tokens
                                        ▼
                              ┌─────────────────────┐
                              │  API Gateway / BFF  │  ← implements the BankingGateway contract
                              └──┬────┬────┬────┬───┘
                                 │    │    │    │        (sync REST for queries/quotes/commands)
              ┌──────────────────┤    │    │    ├───────────────────┐
              ▼                  ▼    ▼    ▼    ▼                   ▼
      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
      │  identity   │   │   wallet    │   │  payments   │   │ engagement  │
      └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
             │                 │                 │                 │
             ▼                 ▼                 ▼                 ▼
      schema: identity     schema: wallet    schema: payments   schema: engagement
             │                 │                 │                 │
             └─────────────────┴──────┬──────────┴─────────────────┘
                                      │
                          ┌───────────▼────────────┐
                          │ notification (schema)   │  ← consumes events from all contexts
                          └─────────────────────────┘
                                      │
                          ┌───────────▼────────────┐
                          │  outbox tables + relay │  → queue → consumers (worker)
                          └─────────────────────────┘
                                      │
                              ┌───────▼────────┐
                              │  NetBank (BaaS)│  funds, accounts, VCAs, rails, KYC, webhooks
                              └────────────────┘
```

**Deployment posture (MVP):** one deployable (Node/TypeScript, mirroring the prototype's
vocabulary), one Postgres instance, five schemas. The schemas _are_ the service boundaries; code
modules must not reach across schemas any more than separate processes would. Splitting into
separate services later is a deployment change, not a redesign (§9).

## 3. Communication

- **Client ↔ BFF:** synchronous REST/JSON over HTTPS, URL-versioned (`/api/v1/...`). The BFF
  exposes the `BankingGateway` shape (accounts, activity, directory, payments, compliance,
  security) so the prototype's ViewModels port almost verbatim.
- **BFF ↔ services:** synchronous HTTP for request/response (quotes, directory lookups, KYC
  status). At most one internal hop for a user-facing call.
- **Services ↔ services:** **async events only.** No service calls another service's API for
  write-path effects. Events are published via the **transactional outbox** pattern (write the
  event in the same DB transaction as the state change), relayed to a queue, and consumed
  independently.
- **Events (past tense, versioned):** `payment.submitted`, `payment.completed`,
  `payment.failed`, `payment.returned`, `cashin.received`, `transfer.received`, `kyc.approved`,
  `kyc.rejected`, `quest.completed`, `session.revoked`, `wallet.frozen`.

Why events for cross-context work: quest progress must not fail a payment, a notification must
not fail a settlement, and the reconciliation job must see every movement even if a consumer is
down. Eventual consistency is acceptable everywhere except the money movement itself, which is a
single-service transaction inside `payments`.

## 4. Database

One Postgres instance, one database, five schemas. Conventions:

- Primary keys: `UUID` (`gen_random_uuid()`). Enums: `TEXT` with `CHECK` where cheap.
- **Money: `BIGINT` minor units** (`amount_minor`, `fee_minor`, …) — never floats.
- Timestamps: `TIMESTAMPTZ`. Flexible payloads: `JSONB` (event payloads only).
- **Isolation rules (the audit's core finding, applied):**
  1. Each service has a dedicated DB **role** granted privileges on its own schema only.
  2. **No foreign keys across schemas.** Cross-context references are opaque UUIDs resolved
     through APIs/events, never joins.
  3. A service may only read its own tables. The sole exception is the outbox **relay** role,
     which reads `outbox` in every schema and writes to the queue.
  4. Migrations are additive-first, one tool (Flyway-style), versioned per schema.

### 4.1 `identity`

```sql
CREATE SCHEMA identity;

CREATE TABLE identity.users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile                TEXT NOT NULL UNIQUE,              -- PH format, e.g. 0917…
  email                 TEXT UNIQUE,
  full_name             TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'active',    -- active | restricted | closed
  kyc_tier              TEXT NOT NULL DEFAULT 'basic',     -- basic | verified | full
  pin_hash              TEXT,                              -- 6-digit transaction PIN, argon2id
  netbank_customer_ref  TEXT,                              -- customer id at NetBank
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE identity.otp_challenges (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  purpose             TEXT NOT NULL,                       -- sign-in | payment | password-reset | device-binding
  masked_destination  TEXT NOT NULL,                       -- "0917 ••• 2288"
  code_hash           TEXT NOT NULL,                       -- never the plaintext code
  expires_at          TIMESTAMPTZ NOT NULL,
  consumed_at         TIMESTAMPTZ,
  attempts            INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE identity.device_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  device_name     TEXT NOT NULL,
  location        TEXT,
  last_active_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE identity.kyc_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  target_tier     TEXT NOT NULL,                           -- verified | full
  document_type   TEXT NOT NULL,                           -- philsys | passport | drivers-license | umid
  status          TEXT NOT NULL DEFAULT 'in-review',       -- in-review | approved | rejected
  review_note     TEXT,
  netbank_kyc_ref TEXT,                                    -- submission id at NetBank
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at      TIMESTAMPTZ
);

CREATE TABLE identity.quiz_results (
  user_id     UUID PRIMARY KEY,
  style_code  TEXT NOT NULL,                               -- e.g. "free-spirit" (scoring TBD, see §10)
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`users.pin_hash` and `otp_challenges.code_hash` are hashes only (argon2id); the plaintext code is
delivered out of band and never stored. KYC document images go to NetBank's KYC API — we keep the
reference, not the scans.

The prototype now models the person separately from the card: `core/domain/user.ts` (with fixture
`data/mock/user.mock.ts`) is deliberately shaped after `identity.users` so the server model and the
client model do not need reconciling later; personal-details edits (`stores/user.store.ts`) step up
through OTP first, which mirrors the `otp_challenges`/`device_sessions` flow above.

### 4.2 `wallet`

```sql
CREATE SCHEMA wallet;

CREATE TABLE wallet.wallets (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL,
  label                    TEXT NOT NULL,                  -- "Main wallet", "Travel jar"
  variant                  TEXT NOT NULL DEFAULT 'teal',   -- card face artwork
  currency                 CHAR(3) NOT NULL DEFAULT 'PHP',
  status                   TEXT NOT NULL DEFAULT 'active', -- active | restricted | closed
  netbank_account_id       TEXT NOT NULL,                  -- NetBank account reference
  netbank_account_number   TEXT NOT NULL,                  -- full number server-side; masked client-side
  card_last4               TEXT,
  frozen                   BOOLEAN NOT NULL DEFAULT false,
  online_payments_enabled  BOOLEAN NOT NULL DEFAULT true,
  atm_withdrawals_enabled  BOOLEAN NOT NULL DEFAULT true,
  opened_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wallet.balance_snapshots (                    -- cache of NetBank's answer, never authoritative
  wallet_id    UUID NOT NULL,
  amount_minor BIGINT NOT NULL,
  as_of        TIMESTAMPTZ NOT NULL,
  synced_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (wallet_id, as_of)
);

CREATE TABLE wallet.spending_limits (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id              UUID NOT NULL,
  per_transaction_minor  BIGINT,
  daily_minor            BIGINT,
  monthly_minor          BIGINT,
  effective_from         TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to           TIMESTAMPTZ
);

CREATE TABLE wallet.virtual_accounts (                     -- inbound funding: "the only way money enters"
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id        UUID NOT NULL,
  account_number   TEXT NOT NULL UNIQUE,                   -- VCA published to other banks
  account_name     TEXT NOT NULL,
  rails            TEXT[] NOT NULL DEFAULT '{instapay,pesonet}',
  netbank_vca_ref  TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`balance_snapshots` is a cache, refreshed from NetBank on every wallet open and after every
webhook. The app's `setBalances` in `wallet.store.ts` will be fed by the BFF from this table.

### 4.3 `payments` (the money context)

```sql
CREATE SCHEMA payments;

CREATE TABLE payments.payment_intents (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL,
  wallet_id            UUID NOT NULL,
  kind                 TEXT NOT NULL,                      -- transfer | cash-in | bill | qr
  rail                 TEXT,                               -- internal | instapay | pesonet
  counterparty         TEXT NOT NULL,                      -- denormalized name for the feed
  counterparty_detail  TEXT,
  amount_minor         BIGINT NOT NULL,
  fee_minor            BIGINT NOT NULL DEFAULT 0,
  total_minor          BIGINT NOT NULL,
  note                 TEXT,
  status               TEXT NOT NULL DEFAULT 'submitted',  -- submitted | completed | failed | returned
  error_code           TEXT,                               -- GatewayErrorCode vocabulary
  confirmation_method  TEXT,                               -- pin | otp | not-required
  idempotency_key      TEXT NOT NULL UNIQUE,               -- client-minted, reused on retry
  netbank_txn_id       TEXT,
  netbank_reference    TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments.transactions (                       -- the activity feed; append-only
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL,
  wallet_id             UUID NOT NULL,
  intent_id             UUID,                              -- null for inbound cash-in pushes
  kind                  TEXT NOT NULL,                     -- card-payment | cash-in | transfer-in | transfer-out | bill-payment | qr-payment
  status                TEXT NOT NULL,                     -- completed | pending | failed | returned
  signed_minor          BIGINT NOT NULL,                   -- negative = money leaving; direction derived from sign
  fee_minor             BIGINT NOT NULL DEFAULT 0,
  counterparty          TEXT NOT NULL,
  counterparty_detail   TEXT,
  reference             TEXT,
  description           TEXT,
  rail                  TEXT,
  netbank_txn_id        TEXT NOT NULL UNIQUE,              -- de-dupe against webhooks/retrieval
  settled_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments.recipients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  name           TEXT NOT NULL,
  initials       TEXT,
  account_number TEXT NOT NULL,
  bank_code      TEXT NOT NULL,                            -- plain string; directory is runtime data
  handle         TEXT NOT NULL,                            -- masked display string ("•••• 4471")
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, bank_code, account_number)
);

CREATE TABLE payments.billers (                            -- reference data, refreshed from NetBank catalog
  id         TEXT PRIMARY KEY,                             -- biller code
  name       TEXT NOT NULL,
  detail     TEXT,
  category   TEXT,
  due_label  TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments.autopay_enrollments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  wallet_id      UUID NOT NULL,
  biller_id      TEXT NOT NULL,
  account_number TEXT NOT NULL,
  amount_minor   BIGINT,
  schedule       TEXT NOT NULL,                            -- schedule model TBD (§10)
  status         TEXT NOT NULL DEFAULT 'active',           -- active | paused
  next_run_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments.statements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id         UUID NOT NULL,
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  opening_minor     BIGINT NOT NULL,
  closing_minor     BIGINT NOT NULL,
  transaction_count INT NOT NULL,
  netbank_ref       TEXT,
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments.disputes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  user_id        UUID NOT NULL,
  reason         TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'open',             -- open | under-review | resolved | rejected
  raised_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ
);

CREATE TABLE payments.reconciliation_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date         DATE NOT NULL,
  netbank_pull_ref TEXT,
  total_matched    INT NOT NULL DEFAULT 0,
  total_unmatched  INT NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'running',        -- running | complete | failed
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ
);
```

### 4.4 `engagement`

```sql
CREATE SCHEMA engagement;

CREATE TABLE engagement.quests (
  id          TEXT PRIMARY KEY,                            -- stable code, e.g. "spend-limit"
  title       TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  xp_reward   INT NOT NULL,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ
);

CREATE TABLE engagement.quest_progress (
  user_id        UUID NOT NULL,
  quest_id       TEXT NOT NULL,
  phase          TEXT NOT NULL DEFAULT 'available',        -- available | tracking | completed
  spent_minor    BIGINT NOT NULL DEFAULT 0,
  limit_minor    BIGINT,                                   -- user-confirmed spending limit
  completed_at   TIMESTAMPTZ,
  reward_applied BOOLEAN NOT NULL DEFAULT false,           -- the "Sunset Ride" card style
  PRIMARY KEY (user_id, quest_id)
);

CREATE TABLE engagement.xp_ledger (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  delta      INT NOT NULL,
  reason     TEXT NOT NULL,                                -- e.g. quest.completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE engagement.user_levels (
  user_id    UUID PRIMARY KEY,
  level      INT NOT NULL DEFAULT 1,
  xp_balance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Quest progress is driven by `payment.completed` events (spent accumulates from the payments
context), so engagement never reads `payments.transactions` directly.

### 4.5 `notification`

```sql
CREATE SCHEMA notification;

CREATE TABLE notification.notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  kind           TEXT NOT NULL,                            -- payment | security | quest | system
  title          TEXT NOT NULL,
  body           TEXT NOT NULL,
  transaction_id UUID,
  read_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification.push_tokens (
  user_id      UUID NOT NULL,
  token        TEXT NOT NULL,
  platform     TEXT NOT NULL,                              -- ios | android | web
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, token)
);
```

The prototype's in-app feed already exists client-side (`domain/notification.ts`,
`data/mock/notifications.mock.ts`, `stores/settings.store.ts`) and already encodes two rules to
preserve server-side: `system` messages are not optional (`visibleNotifications` always passes
them), and `transactionId` links a notification to a real transaction so tapping it resolves.

### 4.6 Outbox (one per service schema)

Each service publishes its own events from its own schema — isolation holds even for the event
plumbing:

```sql
-- Replicated inside EVERY service schema (identity.outbox, wallet.outbox, …)
CREATE TABLE <schema>.outbox (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id     UUID NOT NULL UNIQUE,
  event_type   TEXT NOT NULL,                              -- payment.completed, quest.completed, …
  aggregate_id TEXT NOT NULL,
  payload      JSONB NOT NULL,
  version      INT NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ                                 -- NULL until the relay delivers it
);

CREATE INDEX <schema>_outbox_pending_idx ON <schema>.outbox (id) WHERE published_at IS NULL;
```

The relay reads pending rows across schemas, publishes to the queue, and marks `published_at`.
Consumers are idempotent (`event_id` unique).

## 5. NetBank integration

NetBank (A Rural Bank) Inc. is a BSP-regulated rural bank and BaaS platform — the prototype's
`accounts.mock.ts` already names it correctly. Environment split: sandbox → UAT → production
(`api-sandbox.netbank.ph`, `api-uat.netbank.ph`, `api.netbank.ph`), OAuth 2.0 Client Credentials
for server-to-server calls, short-lived user tokens for app calls.

### 5.1 Product mapping (prototype port → NetBank surface)

| `BankingGateway` port                           | Backend behavior                           | NetBank product / surface                                                                                                      |
| ----------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `accounts.list`                                 | List the user's wallets                    | Account-as-a-Service: list accounts                                                                                            |
| `accounts.virtualAccount`                       | Inbound funding address                    | Virtual Collection Accounts (create, limits, QRPH)                                                                             |
| `accounts.statements`                           | Monthly statements                         | Transaction history / statement retrieval                                                                                      |
| `activity.list` / `get`                         | Activity feed, cursor-paged                | Transaction retrieval (VCA payments, A2A txn details)                                                                          |
| `activity.dispute`                              | Open a dispute                             | Manual ops channel (no public dispute API found)                                                                               |
| `directory.banks`                               | Bank list                                  | Cached directory (rails: instapay / pesonet)                                                                                   |
| `directory.verifyAccountName`                   | Name inquiry before transfer               | InstaPay account-name inquiry                                                                                                  |
| `directory.lookupMobileName`                    | FIN-A wallet name inquiry by mobile number | Internal FIN-A directory (GAP-04 send-to-mobile: the same typo protection as the bank check, for a mobile-number-keyed wallet) |
| `directory.billers`                             | Biller catalog                             | Bills Payment catalog                                                                                                          |
| `directory.validateBillAccount`                 | Biller account validation                  | Biller account validation                                                                                                      |
| `payments.quote`                                | Fee + arrival + cutoff                     | Fee schedule + rail limits (cached, computed server-side)                                                                      |
| `payments.submit`                               | Execute the intent                         | Disburse-to-Account (InstaPay ≤ ₱50k / PESONet), Bills Payment, QRPH collect, internal A2A (real-time to NetBank accounts)     |
| `payments.status`                               | Poll pending                               | A2A txn detail retrieval + webhooks                                                                                            |
| `payments.createInboundQr` / `decodeQr`         | QR PH codes                                | QRPH generation / decode                                                                                                       |
| `payments.openJar` / `jarState`                 | Savings jar lifecycle                      | A2A moves to/from a separate balance (GAP-07); the jar's balance is the bank's answer, cached in `wallet.store.jar`            |
| `compliance.kycStatus` / `submitKyc` / `limits` | Tier + limits                              | KYC/onboarding API; limits computed server-side                                                                                |
| `security.requestOtp` / `verifyOtp`             | OTP challenge                              | Own OTP provider or NetBank (see §10)                                                                                          |
| `security.verifyPin`                            | Transaction PIN                            | **Local only** — the PIN never leaves FIN-A                                                                                    |
| `security.sessions` / `revokeSession`           | Device sessions                            | Local `device_sessions` table                                                                                                  |

### 5.2 Webhooks and reconciliation

- **Webhooks:** VCA payment confirmation (an inbound cash-in arrived) and transaction status
  updates. Verify signatures, process idempotently (`netbank_txn_id` unique constraint), and
  always reconcile by pull as backup — NetBank's docs are retrieval-first.
- **Reconciliation job (daily):** pull NetBank transaction history per wallet, match every row to
  `payments.transactions` by `netbank_txn_id`, insert missing inbound rows, flag unmatched
  movements in `reconciliation_runs` for ops. This is what makes "our records never disagree with
  the bank" operational rather than aspirational.
- **Error mapping:** NetBank rejections map to the closed `GatewayErrorCode` set; `network` /
  `rail-unavailable` are retryable (matches the prototype's `isRetryable`), everything else
  terminal.

### 5.3 Idempotency

Client mints `idempotencyKey` once per payment flow and reuses it verbatim on retry (the
prototype already does this). The `payment_intents.idempotency_key` unique constraint makes a
duplicate submit return the original receipt instead of moving money twice. Server-side, the
NetBank call itself carries a NetBank idempotency key when supported.

## 6. Key flows (walk-throughs)

1. **Outbound InstaPay transfer.** App POSTs the transfer intent (with `idempotencyKey`) → BFF →
   `payments`: validate KYC tier, wallet freeze, rail availability, balance (via NetBank), and the
   step-up rule (transfers to other banks always step up; bills/QR only above ₱10,000) → quote →
   confirmation (PIN or OTP) → submit to NetBank → `payment_intents` row (status `submitted`) +
   outbox `payment.submitted` → webhook/poll → status `completed` → `transactions` row →
   outbox `payment.completed` → consumers: `notification` (feed row), `engagement` (quest spent
   accumulates), `wallet` (balance cache refresh — re-read from NetBank via `syncBalances`, exactly
   as `core/app/syncBalances.ts` does in the prototype).
2. **Cash-in via VCA.** User shares their VCA number; the payer's bank pushes over InstaPay /
   PESONet → NetBank webhook → `payments` upserts an inbound `transactions` row (deduped by
   `netbank_txn_id`) → outbox `cashin.received` → wallet cache + notification. No intent of ours
   exists — hence `intent_id NULL`.
3. **Returned PESONet.** Money left, beneficiary bank rejected it, it comes back. Status is
   `returned` — the receipt and feed say so, distinct from `failed`.
4. **Internal FIN-A transfer.** Both wallets live at NetBank, so "internal" is a real-time A2A
   between NetBank accounts — still one idempotent intent, rail `internal`, no step-up.
5. **Quest completion.** `engagement` consumes `payment.completed`, updates `spent_minor`; when
   spent ≥ limit, phase → `completed`, XP ledger entry, reward style unlock (the "Sunset Ride"
   card face).
6. **Autopay.** Worker selects due `autopay_enrollments`, creates intents, submits, updates
   `next_run_at`. Pause/resume is a status flip.
7. **Send to a mobile number (GAP-04).** Sender looks the recipient up by mobile
   (`directory.lookupMobileName`) → intent kind `transfer` with rail `internal` (both FIN-A wallets
   live at NetBank, so it is a real-time A2A) → the same quote/confirm/submit pipeline, no step-up
   (`requiresStepUp` in `paymentIntent.ts` already returns false for internal rail).
8. **Savings jar (GAP-07).** `payments.openJar` creates the jar at the bank; moves in/out are
   intents with kinds `jar-in` / `jar-out` (no step-up), and `wallet.store.jar` is a cache of
   `payments.jarState` — the jar balance never counts toward the main balance or the spending limit,
   which is a NetBank-side fact, not a client rule.

## 7. Security & compliance

- **Secrets:** OTP codes and the transaction PIN are stored hashed (argon2id), never plaintext;
  OTP has short expiry, attempt cap, and one-time consumption.
- **Server-side enforcement:** KYC tier, rail limits, per-wallet limits, freeze state, and the
  step-up rule are re-checked on every submit — the client's `requiresStepUp` is a UX hint, not a
  control.
- **BSP context:** NetBank is the regulated entity holding funds; FIN-A orchestrates KYC
  submissions (submitted to NetBank's API, decision mirrored back) and must keep an audit trail —
  append-only `transactions` plus the outbox event log give us one.
- **Data privacy (RA 10173):** store only what the product needs (minimal identity fields), mask
  account numbers client-side, honor deletion requests by anonymizing `identity.users` and
  revoking sessions.
- **Device security:** session registry + revocation (the prototype's `device_sessions`).

## 8. Resilience & observability

- **NetBank calls:** explicit timeouts, retries with exponential backoff + jitter (only on
  transient/`network` errors), circuit breaker per product (payments, KYC, directory), fallback
  degradation (e.g. cached bank directory when the directory API is down). This matches the
  prototype's `isRetryable` contract.
- **Outbox relay:** at-least-once delivery; consumers idempotent; dead-letter queue + alert.
- **Health:** `/health/live` and `/health/ready` (DB + queue + NetBank connectivity) on every
  deployable.
- **Observability:** `x-correlation-id` propagated from the app through the BFF, services, queue
  messages, and NetBank outbound calls; structured logs; RED metrics per service; OpenTelemetry
  traces across the payment path.

## 9. Migration path

| Phase     | State                                                    | Data                                                     |
| --------- | -------------------------------------------------------- | -------------------------------------------------------- |
| 0 (now)   | Prototype, mock `BankingGateway`                         | Fixtures in `src/core/data/mock/`                        |
| 1 (MVP)   | One backend, one Postgres, five schemas; NetBank sandbox | Schemas above; BFF exposes the `BankingGateway` contract |
| 2 (scale) | Split services; each schema → its own database           | Events are the only coupling; no redesign                |

- **Schema versioning:** Flyway-style migrations per schema, additive-first, backward-compatible
  event payloads (`version` field on every event).
- **Splitting rule:** a service may leave the monolith when it has no cross-schema read — that is
  guaranteed by construction (§4), so phase 2 is mechanical.

## 10. Open questions

- **Card issuance.** NetBank's BIN sponsorship is listed as "coming soon" — the app's two "cards"
  are wallet faces, not plastic, so this is non-blocking; revisit when available.
- **Statements.** No explicit statement file format (MT940/CSV) found in NetBank's public docs —
  plan reconciliation via retrieval APIs + webhooks; confirm with NetBank before building the
  statement feature. The prototype already generates CSV client-side (`domain/statement.ts`,
  delivered through the `statementExport` platform port), so the server-side source is the open bit.
- **OTP delivery.** Own SMS aggregator vs NetBank OTP — affects `security.requestOtp`.
- **Autopay schedule model.** Day-of-month vs custom cadence; only a display string plus an
  `active`/`paused` status exists today (`AutopayEnrollment` in `domain/payments.ts`).
- **Quiz scoring.** The prototype always returns "The Free Spirit" — the answer is captured but
  never scored (`data/mock/quiz.mock.ts`); decide whether the money-style result is computed
  server-side and stored in `identity.quiz_results`.
- **Direct Debit / FX.** NetBank offers them; explicitly out of scope for the MVP.
