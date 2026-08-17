import { useEffect, useMemo, useState } from "react";
import type { QrPayload } from "../domain/account";
import type { QrIntent } from "../domain/paymentIntent";
import { qrMatrix } from "../domain/qrMatrix";
import { MOCK_QR_INSTRUCTIONS } from "../data/mock/accounts.mock";
import { formatMoney, parseMoneyInput } from "../money/format";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { usePlatform } from "../platform/PlatformContext";
import { paymentActions } from "../stores/payment.store";
import { qrActions, useQrStore } from "../stores/qr.store";
import { useSelectedCard } from "./useCardViews";

/**
 * Scan to pay. The camera sits behind a port this prototype does not implement,
 * so rather than draw a viewfinder that can never see anything, the screen is
 * honest about it and offers the two things that do work: paste a payload, or
 * pick one of the codes the sandbox knows.
 */
export function useQrScanViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const source = useSelectedCard();

  const scanInput = useQrStore((state) => state.scanInput);
  const instruction = useQrStore((state) => state.instruction);
  const payAmountInput = useQrStore((state) => state.payAmount);

  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decode = async (payload: string) => {
    if (!payload.trim()) return;
    setIsDecoding(true);
    setError(null);
    const result = await gateway.payments.decodeQr(payload);
    if (result.ok) qrActions.setInstruction(result.value);
    else {
      qrActions.setInstruction(null);
      setError(result.error.message);
    }
    setIsDecoding(false);
  };

  /** A fixed-amount code locks the amount; an open code lets the payer choose. */
  const lockedAmount = instruction?.amount ?? null;
  const typedAmount = useMemo(() => parseMoneyInput(payAmountInput), [payAmountInput]);
  const amount = lockedAmount ?? typedAmount;

  return {
    title: "Scan to pay",
    intro: "Point-of-sale QR PH codes. This sandbox has no camera, so paste a code or pick one below.",
    cameraNote: "Camera access needs a device port this prototype does not ship.",
    scanInput,
    setScanInput: qrActions.setScanInput,
    canDecode: scanInput.trim().length > 0 && !isDecoding,
    isDecoding,
    decode: () => decode(scanInput),
    sampleCodes: MOCK_QR_INSTRUCTIONS.map((sample) => ({
      id: sample.reference,
      title: sample.merchantName,
      detail: sample.amount
        ? `${formatMoney(sample.amount)} · ${sample.merchantCity}`
        : `Open amount · ${sample.merchantCity}`,
    })),
    useSample: async (reference: string) => {
      qrActions.setScanInput(reference);
      await decode(reference);
    },
    instruction: instruction
      ? {
          merchantName: instruction.merchantName,
          merchantCity: instruction.merchantCity,
          reference: instruction.reference,
          amountLabel: instruction.amount ? formatMoney(instruction.amount) : null,
        }
      : null,
    /** Only shown for open codes — there is nothing to type otherwise. */
    needsAmount: instruction !== null && lockedAmount === null,
    payAmount: payAmountInput,
    setPayAmount: qrActions.setPayAmount,
    availableLabel: source.balanceLabel,
    canPay: Boolean(instruction && amount && amount.amount > 0),
    error,
    clear: qrActions.clearScan,
    pay: () => {
      if (!instruction || !amount || amount.amount <= 0) return;
      const intent: QrIntent = {
        kind: "qr",
        sourceCardId: source.id,
        sourceLabel: `${source.displayLabel} •••• ${source.last4}`,
        instruction,
        amount,
        note: "",
      };
      paymentActions.start(intent, gateway.nextIdempotencyKey());
      navigation.navigate("payment-review");
    },
    showMyCode: () => navigation.navigate("qr-receive"),
    back: navigation.goBack,
  };
}

/**
 * The receive side: generates and displays the user's universal reusable QR Ph code.
 */
export function useQrReceiveViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const platform = usePlatform();
  const card = useSelectedCard();

  const [payload, setPayload] = useState<QrPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void gateway.payments.createInboundQr({ cardId: card.id, amount: null, note: "" }).then((result) => {
      if (!active) return;
      if (result.ok) setPayload(result.value);
      else setError(result.error.message);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [gateway, card.id]);

  return {
    title: "Receive money",
    intro: "Show this code to get paid. Anyone can scan it using any Philippine bank or e-wallet via QR Ph.",
    walletLabel: `${card.displayLabel} •••• ${card.last4}`,
    isLoading,
    error,
    code: payload
      ? {
          /** Booleans, so React Native renders the same grid with <Rect>. */
          matrix: qrMatrix(payload.payload),
          payload: payload.payload,
          merchantName: payload.merchantName,
          amountLabel: payload.amount ? formatMoney(payload.amount) : "Any amount",
          expiresLabel: payload.expiresLabel,
        }
      : null,
    /**
     * Said plainly on the screen: the grid is derived from the payload but is not
     * a scannable QR code, because this app does not ship an encoder.
     */
    sandboxNote: "Sandbox pattern — the payload below is the real thing to share.",
    copied: payload !== null && copiedPayload === payload.payload,
    copyPayload: async () => {
      if (!payload) return;
      const ok = await platform.clipboard.setString(payload.payload);
      setCopiedPayload(ok ? payload.payload : null);
      if (!ok) setError("We could not copy that code.");
    },
    back: navigation.goBack,
  };
}
