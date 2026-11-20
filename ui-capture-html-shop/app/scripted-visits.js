/*
 * For scripted visits only (npm run demo:visits and npm test). A script that
 * drives the shop sets window.keployScriptedVisit before the page loads (a
 * Playwright init script); this module then lets it end the capture
 * (KeployCapture.stop() sends what the SDK still holds) on the last page of
 * a visit and learn that session's id. On any other visit it does nothing.
 * Your own site does not need this file.
 */
import { KeployCapture } from "/vendor/capture-sdk/index.mjs";
import { captureStarted } from "./keploy.js";

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
