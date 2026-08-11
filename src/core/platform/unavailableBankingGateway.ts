import { failed } from "../domain/gatewayResult";
import type { BankingGateway } from "./bankingGateway";

const OFFLINE = "Banking is unavailable in this preview.";
const offline = async () => failed("network", OFFLINE);

/**
 * Safe default for isolated ViewModel tests that do not inject a gateway, and
 * the context default. It reports `network` failures rather than returning empty
 * lists: the previous version answered `[]` and `null`, so a missing provider
 * looked exactly like an empty wallet.
 */
export const unavailableBankingGateway: BankingGateway = {
  accounts: { list: offline, virtualAccount: offline, statements: offline },
  activity: { list: offline, get: offline, dispute: offline },
  directory: { banks: offline, verifyAccountName: offline, billers: offline, validateBillAccount: offline },
  payments: {
    quote: offline,
    submit: offline,
    status: offline,
    openJar: offline,
    jarState: offline,
    createInboundQr: offline,
    decodeQr: offline,
  },
  compliance: { kycStatus: offline, submitKyc: offline, limits: offline },
  security: { requestOtp: offline, verifyOtp: offline, verifyPin: offline, sessions: offline, revokeSession: offline },
  nextIdempotencyKey: () => "unavailable",
};
