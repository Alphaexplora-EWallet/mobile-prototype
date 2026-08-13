# FIN-A Wallet — Registration Flow (Design)

Status: **implemented** (issue ALP-32). Records how the sign-up flow was built into the prototype and
why it is shaped this way, so the reasoning survives. Complements `backend-architecture.md` (ALP-6)
and `multi-user-model.md` (ALP-7): registration is the first act of the `identity` context.

## Flow

```
Welcome
  └─ Create account ──► sign-up (mobile number)
                         └─► sign-up-otp (one-time code, purpose "sign-up")
                              └─► sign-up-details (full name + optional email)
                                   └─► sign-up-pin (6-digit transaction PIN + confirm)
                                        └─► sign-up-done ("Your wallet is ready")
                                              ├─► quiz → result → home   (primary, personality hook)
                                              └─► home                    (secondary)
```

The quiz stays the personality-driven entry: registration hands the new user straight into the
existing money-style quiz, so the "FIN-A" character is not a bolt-on after account creation.

## Decisions

1. **Mobile number is the identity key, matching `identity.users.mobile` (UNIQUE).** The first
   screen collects an 11-digit PH number (`core/domain/mobile.ts` validation); the OTP screen
   proves ownership of it. Email is optional, matching the nullable `identity.users.email`.

2. **`OtpPurpose` gained `"sign-up"`.** The backend's `identity.otp_challenges.purpose` enum
   (sign-in | payment | password-reset | device-binding) is a server decision; registration is a
   distinct purpose because the destination is the _new_ number, handed over for the first time.
   `security.requestOtp(purpose, destination?)` takes that destination on sign-up and masks it into
   the `masked_destination` the challenge already models ("0917 ••• 2288").

3. **The transaction PIN is set through the gateway, never stored.** `security.setPin(pin)` was
   added to the `SecurityPort` contract — the same seam the future server adapter implements. The
   mock gateway owns the PIN in a closure (mirroring `identity.users.pin_hash`: only a hash would
   exist server-side), `verifyPin` checks against it, and the sign-up ViewModel hands the typed PIN
   straight to `setPin`. The registration store deliberately has no `pin` field.

4. **The draft lives in a store, not route params.** `registration.store.ts` carries
   `mobile` / `fullName` / `email` across the five screens, same rule as the quest limit-setup
   step (routes carry no params in this app). It is reset by `resetStores()`, so sign-out and tests
   start clean.

5. **Account creation commits at the PIN step.** The user store (the prototype's `identity.users`)
   is written once, on successful `setPin`: name, mobile, email, and a "Just joined" member-since
   label replacing the demo fixture's; the draft is cleared in the same step. The demo wallet data
   stays as-is — multi-user-model.md states the per-user NetBank account is a phase-1 backend
   concern; the prototype simulates the created wallet with the existing fixtures.

6. **Sign-out rewinds the simulated bank, not just the stores.** The gateway is a module singleton
   (`main.tsx`), so its fixtures outlive the navigation stack. The mock implements an optional
   `reset()` on the `BankingGateway` contract — rewinding balances, KYC tier, sessions and the
   registered transaction PIN to their seeded state — and the app shell calls it after
   `resetStores()` on sign-out. Without it, a sign-up-chosen PIN would survive sign-out and the
   demo credential (`246810`) would fail payment confirm until a reload. A server adapter has no
   equivalent: its state lives server-side.

7. **Validation matches the domain, not ad-hoc copy.** The mobile screen reuses
   `isValidMobileNumber` / `mobileNumberFormatMessage` (the same rules the gateway re-checks), and
   the PIN screen enforces the 6-digit rule the mock's `setPin` enforces — neither side trusts the
   other, per the existing two-sided validation pattern. Pasted international input
   ("+63 917 555 2288") is folded into the national 09-form by `normalizeMobileInput` before the
   length cap applies.

## Contract changes

- `OtpPurpose` += `"sign-up"` (`core/domain/security.ts`)
- `SecurityPort.requestOtp(purpose, destination?)` — optional destination, used by sign-up
- `SecurityPort.setPin(pin)` — local-only PIN registration (`GatewayResult<null>`)
- Mock gateway: `security.setPin` failure-injection call, mutable `transactionPin`, destination
  masking in `requestOtp`, simulation `reset()` (`platform/web/createMockNetBankGateway.ts`)
- `BankingGateway.reset?()` — optional, simulation-only; the mock implements it, the offline
  gateway and a future server adapter omit it

## Test coverage

- `src/test/signup.flow.test.tsx` — happy path (register → quiz → Profile shows the new identity),
  wrong OTP, mismatched PIN recovery, straight-to-wallet, back-to-welcome, back-navigation
  through every step, and the sign-out regression (sign-up PIN must not survive sign-out).
- `createMockNetBankGateway.test.ts` — `setPin` replaces the demo PIN; `verifyPin` follows;
  `reset()` restores the demo credential and balance; sign-up challenge masks the submitted number.
- Golden `01-welcome` snapshot regenerated for the intentional Welcome CTA change (new
  "Create account" primary button).
