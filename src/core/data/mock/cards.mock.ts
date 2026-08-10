import type { CardDefinition, CardId } from "../../domain/card";
import { pesos } from "../../money/money";

export const MOCK_CARDS: readonly CardDefinition[] = [
  {
    id: "main",
    last4: "8421",
    fullNumber: "4829 5510 8823 8421",
    expiry: "05/29",
    securityCode: "427",
    holderName: "Maya Santos",
    openedLabel: "Jan 2025",
    balance: pesos(24_680.5),
    label: "Main wallet",
    variant: "teal",
  },
  {
    id: "travel",
    last4: "1198",
    fullNumber: "4829 5510 8823 1198",
    expiry: "11/30",
    securityCode: "118",
    holderName: "Maya Santos",
    openedLabel: "Jan 2025",
    balance: pesos(8_450),
    label: "Travel jar",
    rewardLabel: "Sunset Ride",
    variant: "sunset",
    artworkId: "sunset-jeepney",
  },
];

export const INITIAL_FROZEN: Readonly<Record<CardId, boolean>> = { main: false, travel: false };

/** Cardholder details printed on the card back. */
export const MOCK_CARDHOLDER = {
  name: "Maya Santos",
  openedLabel: "Jan 2025",
  securityCode: "427",
} as const;
