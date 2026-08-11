import { create } from "zustand";
import type { QrInstruction } from "../domain/account";

export const INITIAL_QR = {
  /** What the user pasted or picked on the scan screen. */
  scanInput: "",
  instruction: null as QrInstruction | null,
  /** Only used by open codes, where the payer chooses the amount. */
  payAmount: "",
  receiveAmount: "",
  receiveNote: "",
};

type QrState = typeof INITIAL_QR & {
  actions: {
    setScanInput(value: string): void;
    setInstruction(instruction: QrInstruction | null): void;
    setPayAmount(value: string): void;
    setReceiveAmount(value: string): void;
    setReceiveNote(value: string): void;
    clearScan(): void;
    reset(): void;
  };
};

export const useQrStore = create<QrState>()((set, get) => ({
  ...INITIAL_QR,
  actions: {
    setScanInput: (scanInput) => {
      if (get().scanInput === scanInput) return;
      // A new code invalidates whatever the last one decoded to.
      set({ scanInput, instruction: null, payAmount: "" });
    },
    setInstruction: (instruction) => set({ instruction }),
    setPayAmount: (payAmount) => set({ payAmount }),
    setReceiveAmount: (receiveAmount) => set({ receiveAmount }),
    setReceiveNote: (receiveNote) => set({ receiveNote }),
    clearScan: () => set({ scanInput: "", instruction: null, payAmount: "" }),
    reset: () => set(INITIAL_QR),
  },
}));

export const qrActions = useQrStore.getState().actions;
