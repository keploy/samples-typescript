// The smoke test: real visits in Chromium to the shop built for the fake
// ingest, then checks on what the SDK sent. The three UI capture sample
// shops share this file; only SHOP below differs.

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import {
  SEARCH_WORD,
  SHOPPER_EMAIL,
  STEPS,
  VISITS,
  clicksPerSession,
  leave,
  pagePaths,
  prepare,
  walk,
} from "../scripts/visits.mjs";
import {
  FAKE_INGEST,
  apiCalls,
  batchesOf,
  clickCount,
  eventsOf,
  pageLoads,
  received,
  routeChanges,
  sessionIdsIn,
  typedValues,
} from "./recording.mjs";

const SHOP = {
  // React and Next.js change routes without loading a page: one session a
  // visit. The plain HTML shop's links load pages: one session a page load.
  multiPage: true,
  // Where the shop and scripts/demo-visits.mjs read the endpoint and key.
  env: { endpoint: "KEPLOY_INGEST_ENDPOINT", key: "KEPLOY_INGEST_KEY" },
};

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const SDK = { name: "@keploy/capture-sdk", version: pkg.dependencies["@keploy/capture-sdk"] };
// The names in the home page's reviews, which the SDK is told never to record (blockSelectors).
const REVIEWERS = ["Riley Example", "Sam Sample"];
// The request a page makes as it loads, and the one each action makes.
const LOAD_CALL = {
  "/": "GET /api/featured",
  "/products": "GET /api/products",
  "/cart": "GET /api/cart",
  "/checkout": "GET /api/cart",
  "/about": "GET /api/about",
};
const ACTION_CALL = {
  search: `GET /api/products?q=${SEARCH_WORD}`,
  addKettle: "POST /api/cart",
  placeOrder: "POST /api/orders",
};

/**
 * Per session of a visit: the request made as its page loaded, and the
 * requests made after that. The scripts act only once the capture is
 * recording, so the later ones are always recorded. The load request races
 * init() loading rrweb, so it may or may not be.
 */
function callsPerSession(visit) {
  const sessions = [];
  for (const name of visit) {
    const step = STEPS[name];
    if (step.kind === "action") sessions.at(-1).after.push(ACTION_CALL[name]);
    else if (!step.link || SHOP.multiPage) sessions.push({ load: LOAD_CALL[step.path], after: [] });
    else sessions.at(-1).after.push(LOAD_CALL[step.path]);
  }
  return sessions;
}

/**
 * A session's recording, as compared below: its pages, in order, its
 * clicks, and its requests but the one its page made as it loaded.
 */
function shape(events, load) {
  const names = apiCalls(events).map((c) => c.name);
  return {
    pages: [...pageLoads(events), ...routeChanges(events).map((r) => r.path)],
    clicks: clickCount(events),
    calls: names[0] === load ? names.slice(1) : names,
  };
}

/** What each session of these visits should hold, in order, with the request its page made as it loaded. */
function expectedShapes(visits) {
  return visits.flatMap((visit) => {
    const pages = pagePaths(visit);
    const clicks = clicksPerSession(visit, SHOP);
    const calls = callsPerSession(visit);
    const pagesOf = (i) => (SHOP.multiPage ? [pages[i]] : pages);
    return calls.map(({ load, after }, i) => ({ load, shape: { pages: pagesOf(i), clicks: clicks[i], calls: after } }));
  });
}

/**
 * Waits until the fake ingest holds these visits whole: every page, every
 * click and every request made once the capture was recording. A page that
 * is left sends its last events as it unloads.
 */
async function arrived(before, visits) {
  const expected = expectedShapes(visits);
  await expect
    .poll(async () => {
      const log = (await received()).slice(before);
      return sessionIdsIn(log).map((id, i) => shape(eventsOf(batchesOf(log, id)), expected[i]?.load));
    })
    .toEqual(expected.map((e) => e.shape));
  return (await received()).slice(before);
}

test("a visit is recorded, masked, and posted by the pinned SDK", async ({ page }) => {
  const visit = VISITS[0]; // home; products: search, add the kettle; cart; checkout: place the order
  const before = (await received()).length;
  await prepare(page.context());
  const sessions = await walk(page, visit, { multiPage: SHOP.multiPage });
  expect(await leave(page)).toBe(sessions.at(-1));
  const log = await arrived(before, [visit]);

  // The visit's sessions, and nothing else, posted to the ingest.
  expect(sessionIdsIn(log)).toEqual(sessions);
  const batches = sessions.flatMap((id) => batchesOf(log, id));
  for (const batch of batches) expect(batch.sdk).toEqual(SDK);

  const perSession = sessions.map((id) => eventsOf(batchesOf(log, id)));
  // A route change is recorded with what moved the page: a link is a push.
  for (const events of perSession) expect(routeChanges(events).every((r) => r.cause === "push")).toBe(true);

  // arrived() checked that every request made while the capture was
  // recording is recorded, the search as the shop sent it: "balanced" keeps
  // a query value whose name is not a credential's ("strict" would replace
  // it). The request a page makes as it loads races init(): say whether it
  // made it.
  callsPerSession(visit).forEach(({ load }, i) => {
    const recorded = apiCalls(perSession[i])[0]?.name === load;
    console.log(`  ${pagePaths(visit)[SHOP.multiPage ? i : 0]}: its load request (${load}) ${recorded ? "was" : "was not"} recorded`);
  });

  // For the record: the other requests the recording holds (a framework's own, say).
  const others = perSession
    .flat()
    .filter((e) => e.type === "network" && !new URL(e.data.url).pathname.startsWith("/api/"))
    .map((e) => {
      const url = new URL(e.data.url);
      return `${e.data.method} ${url.pathname}${[...url.searchParams.keys()].map((k, i) => `${i ? "&" : "?"}${k}=`).join("")}`;
    });
  console.log(`  other recorded requests: ${[...new Set(others)].join(", ") || "none"}`);

  // The SDK's built-in detectors find the email in the order's body.
  const order = perSession.flatMap(apiCalls).find((c) => c.name === "POST /api/orders");
  expect(JSON.parse(order.call.requestBody)).toEqual({ email: "[REDACTED]" });

  // What was typed is recorded as asterisks, one per character.
  const typed = perSession.flatMap(typedValues);
  expect(typed).toContain("*".repeat(SEARCH_WORD.length));
  expect(typed).toContain("*".repeat(SHOPPER_EMAIL.length));
  for (const value of typed) expect(value).toMatch(/^\**$/);

  // Nowhere in what was sent: the email (masked as typed, redacted from the
  // order's body, masked where the confirmation shows it: maskSelectors),
  // the reviewers' names (blockSelectors), or the ingest key.
  const sent = JSON.stringify(batches);
  expect(sent).not.toContain(SHOPPER_EMAIL);
  for (const name of REVIEWERS) expect(sent).not.toContain(name);
  expect(sent).not.toContain(FAKE_INGEST.key);
});

test("npm run demo:visits records every visit whole", async ({ baseURL }) => {
  const before = (await received()).length;
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/demo-visits.mjs"], {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      stdio: "inherit",
      env: {
        ...process.env,
        SHOP_URL: baseURL,
        [SHOP.env.endpoint]: FAKE_INGEST.endpoint,
        [SHOP.env.key]: FAKE_INGEST.key,
        DEMO_DWELL_MS: "0",
        DEMO_GAP_MS: "0",
      },
    });
    child.on("error", reject);
    child.on("exit", resolve);
  });
  expect(exitCode).toBe(0);

  // Every page and every click of every visit, in its session.
  const log = await arrived(before, VISITS);
  const sessions = sessionIdsIn(log);
  const completed = log.filter((r) => r.kind === "complete").map((r) => r.sessionId);
  if (SHOP.multiPage) {
    // Left to end on their own: see scripts/demo-visits.mjs.
    expect(completed).toEqual([]);
  } else {
    expect(completed).toEqual(sessions);
    for (const id of sessions) {
      const doneAt = log.findIndex((r) => r.kind === "complete" && r.sessionId === id);
      const lastBatch = log.findLastIndex((r) => r.kind === "batch" && r.batch.sessionId === id);
      expect(lastBatch, `session ${id} was completed after its last batch`).toBeLessThan(doneAt);
    }
  }
});
