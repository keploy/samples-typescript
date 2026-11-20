/*
 * For scripted visits only (npm run demo:visits and npm test). A script that
 * drives the shop sets window.keployScriptedVisit before the page loads (a
 * Playwright init script); this module then lets it end the capture
 * (KeployCapture.stop() sends what the SDK still holds) and learn the
 * session's id, so it can mark the visit complete (POST
 * /ui/v1/sessions/<id>/complete). On any other visit it does nothing. Your
 * own app does not need this file.
 */
import { KeployCapture } from "@keploy/capture-sdk";
import { captureStarted } from "./keploy";

declare global {
  interface Window {
    keployScriptedVisit?: boolean;
    keployDemo?: { end(): Promise<string> };
  }
}

if (window.keployScriptedVisit === true) {
  window.keployDemo = {
    async end() {
      await captureStarted;
      const sessionId = KeployCapture.getSessionId();
      await KeployCapture.stop();
      return sessionId;
    },
  };
}
