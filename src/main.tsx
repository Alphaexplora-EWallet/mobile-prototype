import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { PlatformProvider } from "@/core/platform/PlatformContext";
import { BankingGatewayProvider } from "@/core/platform/BankingGatewayContext";
import { createWebPlatform } from "@/platform/web/createWebPlatform";
import { createMockNetBankGateway } from "@/platform/web/createMockNetBankGateway";
import "./styles/index.css";

// The web entry chooses the web implementations. A React Native entry would
// build a native Platform here and render the same App.
const platform = createWebPlatform();
// A real rail is not instant. Tests default this to 0 for determinism, so the
// dev server is the only place the loading and error states are visible at all.
// The KYC gateway is seeded with one rejection (selfie failed review) so the
// resubmission path is reachable in the prototype instead of dead code.
const bankingGateway = createMockNetBankGateway({
  latencyMs: 450,
  kycRejection: { reason: "The selfie was too dark to match your ID photo.", stepIndex: 3 },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BankingGatewayProvider gateway={bankingGateway}>
      <PlatformProvider platform={platform}>
        <App />
      </PlatformProvider>
    </BankingGatewayProvider>
  </StrictMode>,
);
