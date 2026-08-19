# Flow and layout audit

47 screens are registered in `SCREENS` (`src/App.tsx`). Around a third of them either duplicate
another screen's content, exist only to hold two or three links, or are unreachable. This is a review
of where the redundancy is and what collapsing it would look like. Nothing here has been changed —
it is a proposal.

## 1. Three competing surfaces for the same four actions

The same money actions are offered in three places, grouped three different ways, and none of the
three sets is complete. Home's quick actions are send / receive / add money / pay
(`useHomeViewModel.ts:25,145`). Wallet's "Move money" block is send / add money / cash out / pay a
bill (`useWalletViewModel.ts:149-152`). The Pay tab's "…" sheet is pay a bill / buy load / show my QR
/ add money / send money (`PaymentsScreen.tsx:117-163`). So "add money" has three entry points and
"cash out" has one, buried on the Wallet tab; and the Pay tab hides its two most important actions
behind an overflow menu on a screen that is otherwise entirely a QR viewfinder.

Pick one canonical action set and put it on Home. Wallet should keep only card-scoped actions (freeze,
limit, jar) since that is what the rest of the screen is about. The Pay tab's sheet should keep only
scanner-adjacent items — upload QR, show my QR — and drop "send money" and "add money".

## 2. `transfer` step 1 and `recipients` are the same screen

`TransferScreen` step 1 renders a search field, three destination rows, the saved-recipient list, and
an "Add new recipient" row. `RecipientsScreen` renders the saved-recipient list plus add-bank and
add-mobile. Both funnel into `transfer-destination` and `send-mobile`. Recipients is reachable only
from Transfer's "Manage" link, and its `select` action just calls `goBack()` to return to the screen
that already showed the same list (`useTransferDestinationViewModel.ts:158-161`). Recipients should be
an edit mode or a sheet on Transfer step 1, not a screen.

## 3. `transfer-destination` and `send-mobile` are one screen with a different input

Compare `TransferDestinationScreen.tsx` and `SendMobileScreen.tsx` side by side: both have an amount
field, an identifier field, a "Check name" verify button, a confirmation prompt, an optional note, an
error line, and Continue → `payment-review`. The only real difference is a bank picker plus a rail
segmented control versus a phone-number input. The split has already produced an inconsistency —
bank transfers offer "Save this recipient" and mobile sends do not, for no reason a user could
explain. Merge into one `transfer-details` screen with a Bank / Mobile segment at the top.

## 4. The payment tail is four screens deep and three of them show the same transaction

The funnel is `payment-review` → `payment-confirm` → `payment-receipt` → `payment-status`, with
`transaction-detail` alongside. `payment-confirm` is an entire screen containing one PIN input; that
is a bottom sheet over the review, not a page. More importantly, receipt, status and
transaction-detail are three renderings of one object: receipt shows amount / counterparty / detail
rows, status shows amount / counterparty / rail / reference / timeline, and transaction-detail shows
amount / counterparty / from / to / fee / reference / note.

The navigation between them is confused enough that the code apologises for it. `PaymentReceiptScreen.tsx:44-51`
has a comment noting that the "View activity" button actually goes to the transaction detail and that
the label is imprecise. Status's "View transaction" also goes to transaction-detail. Detail's "View
all activity" goes to activity. Users land in a small maze at the exact moment they most want a clear
exit.

Collapse to two screens: review (with confirm as a sheet) and `transaction-detail`, given a
just-completed variant that adds the success hero, Share, and Done, and that renders the settlement
timeline inline when the transaction is still settling. That deletes `payment-confirm`,
`payment-receipt` and `payment-status` and removes two taps from every successful payment.

## 5. Three answers to "how do I get money in"

`FundWalletScreen` and `AccountDetailsScreen` both call `gateway.accounts.list()` and both render a
`DetailCard` of account name, account number and bank. Fund-wallet is reached _from_ account-details
(`useAccountViewModel.ts:51`), so the user is shown the same three fields on two consecutive screens.
`QrReceiveScreen` answers the same question with a QR code and has three separate entry points.

One "Receive money" screen with QR and Account number tabs covers all of it. Whatever is left of
account-details — status, opened date — belongs on `personal-details`.

## 6. Screens that exist only to hold two or three links

`SettingsScreen` is 32 lines and two toggles, dark mode and show balances. Dark mode already has its
own button in the Home header (`HomeScreen.tsx:19-27`), so the app ships two controls for one
preference in two different places. Both rows belong inline on Profile and the page should go.

`StatementsScreen` is a month list and nothing else; fold the picker into `statement-month`, which
already has a not-found state. `CardAddScreen` is a three-row menu where two rows only fire
`showSimulated` — a sheet from Wallet's "Add card". `CardDetailScreen` is a four-row detail card plus
three links that all fire `showSimulated`; nothing on it works, and it belongs as an expansion of the
Wallet card. `AccountDetailsScreen`, per the point above, is a pass-through whose two other links
(card-detail, statements) are already on Profile.

## 7. Screens and controls that make no sense as they stand

~~`sign-in-otp` is unreachable.~~ **Closed.** The whole auth journey is real now, on the credential
model a Philippine wallet uses: a mobile number as the account key, a one-time code to prove it, and
a 6-digit MPIN for every login after. `sign-in-otp` became `auth-otp` and serves registration, and
MPIN reset; `forgot-password` became `forgot-pin`, since there is no password left to reset. Signing
in is no longer a form nothing reads — `session.store` holds the session, `app/bridges/SessionBridge`
persists the token through `StoragePort`, and `useAppShellViewModel` gates the tab shell on it, so a
signed-out visitor cannot reach Home and a reload does not sign you out. See `src/test/auth.flow.test.tsx`.

`result` has two actions, "Build my plan" and the close ×, and both call `resetTo("home")`. Two
buttons, one behaviour, and no plan is built. The screen also hardcodes "The Free Spirit" while its
ViewModel exposes an unused `styleName`. Either make the CTA lead somewhere — the quest tab with the
profile applied is the obvious target — or make this a sheet over Home.

On Home, three affordances promise interaction and do not deliver: the "This month" cash-flow dropdown
has no handler (`HomeScreen.tsx:138`), the "Tip for you" card has a chevron and no `onClick`
(`HomeScreen.tsx:224-233`), and the donut is a hardcoded SVG with fixed dash arrays and hardcoded
₱25,750 / ₱8,320 fallbacks. Meanwhile `insights`, which computes real category and merchant rollups,
is buried two levels down under Activity. Put insights where the fake donut is.

`bank-accounts` (accounts you send from) and `recipients` (accounts you send to) are mirrored screens
with near-identical markup and names that do not distinguish them. If recipients collapses into
transfer per point 2, rename this one to something unambiguous — "Funding sources".

Welcome's "step 1 of 3" dots are decorative; nothing advances them.

## 8. Tab bar

The tabs are Home / Wallet / Pay / Quests / Profile. Pay is a full-screen QR viewfinder — a
persistent tab spent on a single action, which is why send and add-money ended up in an overflow
sheet. Activity, which in a wallet is typically the second-most-visited screen, has no tab at all and
sits behind a "See all" link on Home.

Consider swapping: Activity becomes a tab, and Scan becomes a prominent Home action or a floating
button. That gives every tab a durable data surface behind it rather than one camera.

## Net effect

| Action                                                     | Screens |
| ---------------------------------------------------------- | ------- |
| Merge `send-mobile` into `transfer-destination`            | −1      |
| `payment-confirm` → sheet                                  | −1      |
| `payment-receipt`, `payment-status` → `transaction-detail` | −2      |
| `recipients` → sheet on transfer                           | −1      |
| `fund-wallet` + `qr-receive` → one Receive screen          | −1      |
| `account-details` → `personal-details`                     | −1      |
| `settings` → inline on Profile                             | −1      |
| `statements` → `statement-month`                           | −1      |
| `card-add`, `card-detail` → Wallet sheet / inline          | −2      |
| `result` → sheet                                           | −1      |
| ~~`sign-in-otp` — wire or delete~~ (done: `auth-otp`)      | −1      |

47 → roughly 34, and the happy path for a bank transfer drops from six screens to four.

## Sequencing

The golden snapshot in `src/test/app.flow.test.tsx` pins all 12 original screens and the full quest
flow, so any of these changes will turn it red. Work in one merge per commit, state in the commit
message that the snapshot change is intended, and never run `vitest -u` to clear it wholesale.

The cheapest wins first, since they touch no flow logic: ~~delete or wire `sign-in-otp`~~ (done), fix `result`'s
duplicate actions, remove the dead Home affordances, and fold `settings` into Profile. The
payment-tail collapse in point 4 is the highest-value and the most invasive; do it last, after the
`PaymentIntent` union is the single source of truth for what the detail screen renders.
