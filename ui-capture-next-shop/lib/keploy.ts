/*
 * Keploy UI capture: records what a visitor does in the shop and the shop's
 * own requests, masks personal data in the browser, and posts the recording
 * to Keploy in batches.
 *
 * instrumentation-client.ts imports this module, so init() starts in the
 * browser before the app hydrates. The endpoint and key come from .env
 * (NEXT_PUBLIC_ variables are built into the page). On the server, where
 * pages are rendered too, nothing starts.
 *
 * init() records the page's requests from the moment it has loaded rrweb
 * (a chunk of its own), not before: a request the page makes while that
 * chunk is still loading is not recorded at all. Starting init() before
 * hydration narrows that window; the shop does not hold its own requests
 * back to close it, so the first page's first request may be missing from
 * a recording (npm test prints whether it made it).
 */
import { KeployCapture } from "@keploy/capture-sdk";

const endpoint = process.env.NEXT_PUBLIC_KEPLOY_INGEST_ENDPOINT;
const apiKey = process.env.NEXT_PUBLIC_KEPLOY_INGEST_KEY;

async function startCapture(): Promise<void> {
  if (!endpoint || !apiKey) {
    console.info(
      "[shop] Keploy UI capture is off: set NEXT_PUBLIC_KEPLOY_INGEST_ENDPOINT and NEXT_PUBLIC_KEPLOY_INGEST_KEY in .env",
    );
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
export const captureStarted: Promise<void> =
  typeof window === "undefined"
    ? Promise.resolve()
    : startCapture().catch((err: unknown) => {
        console.error("[shop] Keploy UI capture did not start:", err);
      });
