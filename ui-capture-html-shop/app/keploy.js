/*
 * Keploy UI capture: records what a visitor does in the shop and the shop's
 * own requests, masks personal data in the browser, and posts the recording
 * to Keploy in batches.
 *
 * No bundler: the SDK is imported from its dist/ directory, which the
 * server serves as npm installed it, and every page maps "rrweb", which the
 * SDK imports by name, with an import map. Every page loads this module
 * with an async script tag of its own, so each page load starts its own
 * capture: on a site whose links load pages, every page load is a session
 * of its own. The page's own script neither imports it nor waits for it,
 * so a page works whether or not the SDK loads.
 *
 * init() records the page's requests from the moment it has loaded rrweb,
 * not before: a request the page makes while rrweb is still loading is not
 * recorded at all. Starting init() first narrows that window; the shop does
 * not hold its own requests back to close it, so a page's first request
 * is usually missing from its recording (npm test prints whether it made
 * it).
 *
 * The endpoint and key come from .env, through the server's
 * /keploy-config.js. On your own static site, write them here instead: a UI
 * ingest key is safe to ship in a page.
 */
import { KeployCapture } from "/vendor/capture-sdk/index.mjs";
import { apiKey, endpoint } from "/keploy-config.js";

async function startCapture() {
  if (!endpoint || !apiKey) {
    console.info("[shop] Keploy UI capture is off: set KEPLOY_INGEST_ENDPOINT and KEPLOY_INGEST_KEY in .env");
    return;
  }
  await KeployCapture.init({
    endpoint,
    apiKey,
    // The default, written out: every typed value is masked, and the page's
    // visible text is kept. "strict" also masks all visible text and records
    // no request or response body.
    privacyMode: "balanced",
    privacy: {
      // Text that repeats what the shopper typed: the order confirmation
      // shows their email, so its text is masked.
      maskSelectors: ["[data-testid=order-confirmation]"],
      // Never recorded: the reviews (people's names) are replaced by an
      // empty box of the same size.
      blockSelectors: ["[data-testid=reviews]"],
      // A route whose path holds a credential, such as an invite link, is
      // declared so its value is kept out of every event. The shop has none:
      // secretRoutes: ["/invites/:key"],
    },
    onError(err) {
      // The visitor's browser sends Do Not Track or Global Privacy Control:
      // nothing is recorded, and nothing needs fixing.
      if (err.code === "KUI_E_CAPTURE_DECLINED") return;
      console.error(`[shop] Keploy UI capture stopped: ${err.code}`, err.message);
    },
  });
  const sessionId = KeployCapture.getSessionId();
  if (sessionId) console.info(`[shop] Keploy UI capture is recording session ${sessionId}`);
}

/** Settles once capture has started, or once it is off, declined or refused. */
export const captureStarted = startCapture().catch((err) => {
  console.error("[shop] Keploy UI capture did not start:", err);
});
