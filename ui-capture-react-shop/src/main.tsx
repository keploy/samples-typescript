// Keploy UI capture first, so it starts before any of the app's code: see keploy.ts.
import "./keploy";
// Only for the scripted visits (npm run demo:visits, npm test).
import "./scripted-visits";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
