import type { BankAccount, InboundQrRequest, QrInstruction, QrPayload, VirtualAccount } from "../domain/account";
import type { ActivityPage, ActivityQuery, BankingTransaction, PaymentQuote, PaymentReceipt } from "../domain/banking";
import type { KycStatus, KycSubmission, TierLimits } from "../domain/compliance";
import type { Statement } from "../domain/statement";
import type { GatewayResult } from "../domain/gatewayResult";
import type { PaymentIntent } from "../domain/paymentIntent";
import type { Biller } from "../domain/payments";
import type { Bank, BankCode } from "../domain/rails";
import type { ConfirmationToken, DeviceSession, OtpChallenge, OtpPurpose } from "../domain/security";
import type { AuthSession, SessionToken } from "../domain/session";
import type { Money } from "../money/money";

/**
 * The seam a future server-side NetBank adapter implements. The browser never
 * talks to a bank directly; this prototype injects a local mock at startup.
 *
 * Two things to know before adding to this:
 *
 * 1. **Every call returns `GatewayResult`, never throws.** The reason a payment
 *    failed has to be able to reach the screen.
 * 2. **Sub-ports, not eighteen flat methods** — the same grouping `Platform` in
 *    `ports.ts` already uses. A screen depends on one group, which keeps the
 *    dependency legible.
 *
 * This replaces the original three-method surface (`listActivity`,
 * `getTransaction`, `createTransfer`). Those were not executable by a real
 * adapter: the old `Recipient` carried only a masked display handle, so there
 * was no account number, bank code, rail, or idempotency key to send.
 */
export interface BankingGateway {
  readonly auth: AuthPort;
  readonly accounts: AccountsPort;
  readonly activity: ActivityPort;
  readonly directory: DirectoryPort;
  readonly payments: PaymentsPort;
  readonly compliance: CompliancePort;
  readonly security: SecurityPort;
  /**
   * A fresh key for the next `payments.submit`. Deliberately on the gateway
   * rather than generated in a ViewModel: `crypto.randomUUID()` is a web global
   * this codebase bans, and a caller-side counter cannot survive a reload.
   */
  nextIdempotencyKey(): string;
}

export interface AccountsPort {
  list(): Promise<GatewayResult<readonly BankAccount[]>>;
  /** The inbound account number other banks can push to. */
  virtualAccount(accountId: string): Promise<GatewayResult<VirtualAccount>>;
  statements(): Promise<GatewayResult<readonly Statement[]>>;
}

export interface ActivityPort {
  list(query?: ActivityQuery): Promise<GatewayResult<ActivityPage>>;
  get(id: string): Promise<GatewayResult<BankingTransaction | null>>;
  dispute(id: string, reason: string): Promise<GatewayResult<BankingTransaction>>;
}

export interface DirectoryPort {
  banks(): Promise<GatewayResult<readonly Bank[]>>;
  /**
   * Account name inquiry — the step that stops money going to a typo. Real
   * InstaPay exposes this, and confirming the name is the only protection a
   * sender has.
   */
  verifyAccountName(bankCode: BankCode, accountNumber: string): Promise<GatewayResult<AccountNameResult>>;
  /**
   * Name inquiry for a mobile-number-keyed FIN-A wallet — the same protection
   * as the bank account check, for a number instead of an account number.
   */
  lookupMobileName(phoneNumber: string): Promise<GatewayResult<MobileNameResult>>;
  billers(): Promise<GatewayResult<readonly Biller[]>>;
  validateBillAccount(billerId: string, accountNumber: string): Promise<GatewayResult<BillAccountResult>>;
}

export type AccountNameResult = { accountName: string; bankCode: BankCode; accountNumber: string };

export type MobileNameResult = { accountName: string; phoneNumber: string };

export type BillAccountResult = {
  accountName: string;
  /** Present when the biller reports an outstanding balance to prefill. */
  amountDue?: Money;
};

/**
 * The savings jar as the bank sees it: a separate balance that never counts
 * toward the main wallet balance or the spending limit. The jar does not exist
 * until `payments.openJar` creates it.
 */
export type JarState = {
  opened: boolean;
  balance: Money;
};

export interface PaymentsPort {
  /** What this intent will cost and when it will land. No side effects. */
  quote(intent: PaymentIntent): Promise<GatewayResult<PaymentQuote>>;
  /**
   * Executes the intent. `idempotencyKey` must come from
   * `nextIdempotencyKey()` and be reused verbatim on retry — resubmitting the
   * same key returns the original receipt instead of moving money twice.
   */
  submit(
    intent: PaymentIntent,
    idempotencyKey: string,
    confirmation: ConfirmationToken,
  ): Promise<GatewayResult<PaymentReceipt>>;
  /** Poll a pending transaction until it clears, fails, or is returned. */
  status(id: string): Promise<GatewayResult<BankingTransaction>>;
  /** Opens the savings jar; a no-op when it is already open. */
  openJar(): Promise<GatewayResult<JarState>>;
  /** The jar's current state — the bank's answer, not the store's cache. */
  jarState(): Promise<GatewayResult<JarState>>;
  createInboundQr(request: InboundQrRequest): Promise<GatewayResult<QrPayload>>;
  decodeQr(payload: string): Promise<GatewayResult<QrInstruction>>;
}

export interface CompliancePort {
  kycStatus(): Promise<GatewayResult<KycStatus>>;
  submitKyc(submission: KycSubmission): Promise<GatewayResult<KycStatus>>;
  /** Limits depend on the KYC tier, so this is the same fact as `kycStatus`. */
  limits(): Promise<GatewayResult<TierLimits>>;
}

/**
 * Establishing a session, as opposed to stepping one up.
 *
 * Deliberately not folded into `SecurityPort`: that port answers "prove it is
 * still you" for a payment or a profile edit, which presupposes a session. This
 * one creates and ends them, and it is the only port callable while signed out.
 *
 * The credential model is the one a Philippine wallet actually uses — a mobile
 * number as the account key, a one-time code to prove the number, and a 6-digit
 * MPIN for every login after that. No password anywhere.
 */
export interface AuthPort {
  /**
   * Whether this mobile already has an account, so the entry screen can send a
   * returning user to the MPIN and a new one to the code. The masked
   * destination comes back either way — the caller must not be able to tell
   * "not registered" from "registered" by *which* fields are present.
   */
  lookupMobile(mobile: string): Promise<GatewayResult<MobileLookupResult>>;
  /** Begins registration by sending the code that proves the number. */
  startSignUp(mobile: string): Promise<GatewayResult<OtpChallenge>>;
  /**
   * Creates the account and its first session. `confirmation` is the token
   * `security.verifyOtp` issued for the `sign-up` purpose, and is spent here —
   * one code, one account.
   */
  completeSignUp(input: SignUpInput): Promise<GatewayResult<AuthSession>>;
  signIn(input: SignInInput): Promise<GatewayResult<AuthSession>>;
  /** Forgot the MPIN: an OTP-gated replacement, which also signs you in. */
  resetPin(input: ResetPinInput): Promise<GatewayResult<AuthSession>>;
  signOut(): Promise<GatewayResult<null>>;
  /**
   * Re-establishes a session from a persisted token, and rejects one it does not
   * recognise. This is what makes a reload keep you signed in without the app
   * ever storing the MPIN.
   */
  resume(token: SessionToken): Promise<GatewayResult<AuthSession>>;
}

export type MobileLookupResult = {
  registered: boolean;
  /** e.g. "0917 ••• 2288" — where a code would be sent. */
  maskedDestination: string;
};

export type SignUpInput = {
  mobile: string;
  fullName: string;
  pin: string;
  confirmation: ConfirmationToken;
};

export type SignInInput = { mobile: string; pin: string };

export type ResetPinInput = { mobile: string; pin: string; confirmation: ConfirmationToken };

export interface SecurityPort {
  requestOtp(purpose: OtpPurpose): Promise<GatewayResult<OtpChallenge>>;
  verifyOtp(purpose: OtpPurpose, code: string): Promise<GatewayResult<ConfirmationToken>>;
  /** Confirms a payment with the transaction PIN instead of an OTP. */
  verifyPin(pin: string): Promise<GatewayResult<ConfirmationToken>>;
  sessions(): Promise<GatewayResult<readonly DeviceSession[]>>;
  revokeSession(id: string): Promise<GatewayResult<readonly DeviceSession[]>>;
}
