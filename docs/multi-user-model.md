# FIN-A Wallet — NetBank Multi-User Model (Decision)

Status: **decided** (issue ALP-7), verified against current `src/core` 2026-08-13. Records how
multiple FIN-A users map onto NetBank accounts, and why. Complements `backend-architecture.md`,
which assumes this model in its TL;DR; this file is the decision behind that assumption.

## Decision

**One NetBank customer record per FIN-A user, one NetBank savings account per wallet — not one
shared account with internal division.** Concretely:

- `identity.users.netbank_customer_ref` → one NetBank customer record per user (AaaS "Create
  Customer Record", KYC'd through NetBank's tiered KYC or the partner's own AMLC-compliant KYC).
- `wallet.wallets.netbank_account_id` / `netbank_account_number` → one NetBank account per wallet
  (AaaS "Create Bank Account"), white-labeled under the end-user's name.
- Inbound funding stays per wallet via Virtual Collection Accounts; FIN-A-to-FIN-A transfers are
  real-time A2A between NetBank accounts.

This matches what the mock already models (`src/core/data/mock/accounts.mock.ts`): Maya's two cards
are two distinct NetBank account numbers under one customer.

## Status against current code (2026-08-13)

Verified against the current tree — the model holds and the prototype has moved closer to it:

- `data/mock/accounts.mock.ts` — two `BankAccount`s (`acct-main` 009123456789, `acct-travel`
  009987651198), both in the name `MAYA SANTOS`, both at "NetBank (A Rural Bank), Inc.": one
  customer, two accounts, exactly the 1:1 mapping above.
- `data/mock/user.mock.ts` — the prototype now models the person separately from the card
  (`core/domain/user.ts`): full name, mobile, email, status, shaped after `identity.users` so the
  client model and the server schema do not have to be reconciled later.
- `data/mock/accounts.mock.ts` also seeds `MOCK_VIRTUAL_ACCOUNT` — the per-wallet inbound address
  (VCA) that the "inbound funding stays per wallet" line above describes.
- `stores/accounts.store.ts` (GAP-09) added user-managed **linked** bank accounts beyond the card
  faces; those are additional per-account NetBank records under the same customer, not a pooled
  balance — consistent with this decision.
- The savings jar (`payments.openJar` / `jarState`) is the one intentional exception to "one
  account per wallet": it is a second balance on the same wallet, still a NetBank-side account
  rather than an internal FIN-A sub-ledger.

## Why not a shared account with internal division

Option considered and rejected: FIN-A opens its own corporate ("safeguarded") NetBank account and
keeps a sub-ledger of per-user balances. NetBank does support accounts under the company's name, so
it is technically possible — but:

1. **Regulatory.** A user balance that exists only in FIN-A's ledger, backed by funds in FIN-A's own
   account, is a claim against FIN-A — e-money issuance under BSP Circular No. 649 s. 2009 (only
   banks / non-bank financial institutions with prior BSP authorization may issue e-money; the float
   must be fully backed in segregated accounts; e-money is not a deposit and is not PDIC-insured).
   FIN-A would need EMI registration or a licensed partner program — a regulatory program, not a
   wallet feature.
2. **Breaks the two-ledger rule** (`backend-architecture.md` §1.1). NetBank's core is the truth;
   FIN-A records are evidence. A pooled account makes FIN-A's sub-ledger the only source of per-user
   truth, and every inbound InstaPay credit lands unattributed in the pool — attribution and
   reconciliation become FIN-A's liability for every peso.
3. **Breaks per-account features.** VCAs (a unique cash-in address per wallet), QRPH, statements,
   disputes, and account-name inquiry are all per-account at the bank; a payer's transfer to the
   pool carries no user identifier.
4. **KYC burden stays.** FIN-A must still know whose money each sub-balance is — same identity work,
   minus bank-side verification.

The only upside is cost (no per-user account fees), which the compliance burden dominates.

## Why per-user accounts

- NetBank remains the regulated holder of each user's funds — real deposit accounts in the user's
  name (PDIC-insured per depositor); FIN-A's database stays evidence-only, preserving the two-ledger
  rule.
- The draft schema already matches 1:1 (`netbank_customer_ref`, `netbank_account_id` /
  `netbank_account_number`).
- Every planned feature (cash-in VCA, QRPH, statements, disputes, name-inquiry, internal A2A) maps
  to a per-account bank operation.
- Cost is linear and published: ₱50 KYC per account opening + ₱20 per account per month, no minimum
  invoice, no ADB requirement (standard AaaS pricing; confirm in the BaaS agreement).
- Multiple users change the data volume, not the architecture — no design change from today's
  single-user prototype.

## Open items

- Confirm VCA availability with NetBank: the product-services page lists Virtual Collection Accounts
  as "Coming Soon" while the API docs expose a full VCA section (likely stale UI).
- Confirm final AaaS pricing and the consent-token mechanism for debiting end-user savings accounts
  in the BaaS license agreement.
- BSP Circular 649's content is corroborated but not machine-verified (the PDF on bsp.gov.ph is a
  scan); revisit when scoping production compliance.

## References

- NetBank Virtual — Account-as-a-Service: `https://virtual.netbank.ph/business-account-as-a-service`,
  `https://virtual.netbank.ph/technical-account-as-a-service` (fetched 2026-08-11).
- NetBank Virtual — Digital Banking API docs (AaaS + VCA operations): `https://virtual.netbank.ph/docs`.
- NetBank.ph homepage (BaaS positioning, "safeguarded corporate account"): `https://netbank.ph`.
- BSP Circular No. 649 s. 2009: `https://www.bsp.gov.ph/Regulations/Issuances/2009/c649.pdf`.
