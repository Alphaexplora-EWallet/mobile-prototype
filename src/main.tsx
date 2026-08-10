import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { PlatformProvider } from "@/core/platform/PlatformContext";
import { createWebPlatform } from "@/platform/web/createWebPlatform";
import "./styles/index.css";

// The web entry chooses the web implementations. A React Native entry would
// build a native Platform here and render the same App.
const platform = createWebPlatform();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlatformProvider platform={platform}>
      <App />
    </PlatformProvider>
  </StrictMode>,
);
