import { createContext, useContext, type ReactNode } from "react";
import type { BankingGateway } from "./bankingGateway";
import { unavailableBankingGateway } from "./unavailableBankingGateway";

const BankingGatewayContext = createContext<BankingGateway>(unavailableBankingGateway);

export function BankingGatewayProvider({ gateway, children }: { gateway: BankingGateway; children: ReactNode }) {
  return <BankingGatewayContext.Provider value={gateway}>{children}</BankingGatewayContext.Provider>;
}

export const useBankingGateway = (): BankingGateway => useContext(BankingGatewayContext);
