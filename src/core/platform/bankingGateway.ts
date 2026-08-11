import type { BankAccount, InboundQrRequest, QrInstruction, QrPayload, VirtualAccount } from "../domain/account";
import type { ActivityPage, ActivityQuery, BankingTransaction, PaymentQuote, PaymentReceipt } from "../domain/banking";
import type { KycStatus, KycSubmission, TierLimits } from "../domain/compliance";
import type { Statement } from "../domain/statement";
import type { GatewayResult } from "../domain/gatewayResult";
import type { PaymentIntent } from "../domain/paymentIntent";
import type { Biller } from "../domain/payments";
import type { Bank, BankCode } from "../domain/rails";
import type { ConfirmationToken, DeviceSession, OtpChallenge, OtpPurpose } from "../domain/security";
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
  billers(): Promise<GatewayResult<readonly Biller[]>>;
  validateBillAccount(billerId: string, accountNumber: string): Promise<GatewayResult<BillAccountResult>>;
}

export type AccountNameResult = { accountName: string; bankCode: BankCode; accountNumber: string };

export type BillAccountResult = {
  accountName: string;
  /** Present when the biller reports an outstanding balance to prefill. */
  amountDue?: Money;
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
  createInboundQr(request: InboundQrRequest): Promise<GatewayResult<QrPayload>>;
  decodeQr(payload: string): Promise<GatewayResult<QrInstruction>>;
}

export interface CompliancePort {
  kycStatus(): Promise<GatewayResult<KycStatus>>;
  submitKyc(submission: KycSubmission): Promise<GatewayResult<KycStatus>>;
  /** Limits depend on the KYC tier, so this is the same fact as `kycStatus`. */
  limits(): Promise<GatewayResult<TierLimits>>;
}

export interface SecurityPort {
  requestOtp(purpose: OtpPurpose): Promise<GatewayResult<OtpChallenge>>;
  verifyOtp(purpose: OtpPurpose, code: string): Promise<GatewayResult<ConfirmationToken>>;
  /** Confirms a payment with the transaction PIN instead of an OTP. */
  verifyPin(pin: string): Promise<GatewayResult<ConfirmationToken>>;
  sessions(): Promise<GatewayResult<readonly DeviceSession[]>>;
  revokeSession(id: string): Promise<GatewayResult<readonly DeviceSession[]>>;
}
