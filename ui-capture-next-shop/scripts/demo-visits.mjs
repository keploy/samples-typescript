// npm run demo:visits -- five scripted visits to the running shop, in a
// headless Chromium, each ended at once so Keploy turns it into flows now
// instead of after 30 idle minutes.
//
// It reads the shop's own .env (the ingest endpoint and key the shop was
// started with) and visits SHOP_URL, http://localhost:3000 by default
// (npm run build && npm start). DEMO_DWELL_MS and DEMO_GAP_MS set its pace.

import { chromium } from "@playwright/test";
import { VISITS, complete, leave, pagesOf, prepare, walk } from "./visits.mjs";

const shopUrl = process.env.SHOP_URL || "http://localhost:3000";
const endpoint = process.env.NEXT_PUBLIC_KEPLOY_INGEST_ENDPOINT;
const apiKey = process.env.NEXT_PUBLIC_KEPLOY_INGEST_KEY;
const pace = {
  dwellMs: Number(process.env.DEMO_DWELL_MS ?? 6000),
  gapMs: Number(process.env.DEMO_GAP_MS ?? 1000),
};
// Routes change without loading a page: one session a visit, ended and
// completed at once.
const multiPage = false;

if (!endpoint || !apiKey) {
  console.error("Set NEXT_PUBLIC_KEPLOY_INGEST_ENDPOINT and NEXT_PUBLIC_KEPLOY_INGEST_KEY in .env first (see .env.example).");
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
    for (const id of sessions) await complete(endpoint, apiKey, id);
    console.log(`visit ${n + 1}/${VISITS.length}: ${pagesOf(visit)} -- session ${sessions.join(", ")} completed`);
    await context.close();
  }
} finally {
  await browser.close();
}
