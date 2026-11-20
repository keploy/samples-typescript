// npm run demo:visits -- five scripted visits to the running shop, in a
// headless Chromium. Every page load is a session of its own here; Keploy
// turns each into flows once it has been idle for 30 minutes.
//
// It reads the shop's own .env (the ingest endpoint and key the shop was
// started with) and visits SHOP_URL, http://localhost:8080 by default
// (npm start). DEMO_DWELL_MS and DEMO_GAP_MS set its pace.

import { chromium } from "@playwright/test";
import { VISITS, leave, pagesOf, prepare, walk } from "./visits.mjs";

const shopUrl = process.env.SHOP_URL || "http://localhost:8080";
const endpoint = process.env.KEPLOY_INGEST_ENDPOINT;
const apiKey = process.env.KEPLOY_INGEST_KEY;
const pace = {
  dwellMs: Number(process.env.DEMO_DWELL_MS ?? 6000),
  gapMs: Number(process.env.DEMO_GAP_MS ?? 1000),
};
// Links load pages here: every page load is a session of its own. A page
// that is left sends its last events as it unloads, and no script can tell
// when those have arrived, so these sessions are not completed early
// (POST /ui/v1/sessions/<id>/complete): Keploy ends each once it has been
// idle for 30 minutes.
const multiPage = true;

if (!endpoint || !apiKey) {
  console.error("Set KEPLOY_INGEST_ENDPOINT and KEPLOY_INGEST_KEY in .env first (see .env.example).");
  process.exit(2);
}

const browser = await chromium.launch();
try {
  for (const [n, visit] of VISITS.entries()) {
    const context = await browser.newContext({ baseURL: shopUrl });
    await prepare(context);
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") console.error(`  page error: ${message.text()}`);
    });
    const sessions = await walk(page, visit, { ...pace, multiPage });
    await leave(page);
    console.log(`visit ${n + 1}/${VISITS.length}: ${pagesOf(visit)} -- sessions ${sessions.join(", ")} sent`);
    await context.close();
  }
} finally {
  await browser.close();
}
