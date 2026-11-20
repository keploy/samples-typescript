// Reads what the fake ingest received (test/fake-ingest.mjs), for the smoke
// test. A batch is what the SDK posts: {sessionId, batchId, events, metadata,
// sdk, captureIdentity}; an event is {type: "dom" | "network", data, seq},
// a "dom" event's data an rrweb event.

/** The fake ingest the tests start, and the made-up key the test build carries. */
export const FAKE_INGEST = {
  origin: "http://127.0.0.1:8787",
  endpoint: "http://127.0.0.1:8787/ui/v1/ingest",
  key: "kep_fake_ingest_key_for_the_smoke_test",
};

const RRWEB_META = 4; // the page a recording is on: {href, width, height}, plus cause for a route change
const RRWEB_INCREMENTAL = 3;
const RRWEB_MOUSE = 2; // an incremental event's source: a mouse interaction
const RRWEB_CLICK = 2; // a mouse interaction's type: a click
const RRWEB_INPUT = 5; // an incremental event's source: a field's value

/** Everything the fake ingest received, in order: {kind: "batch", batch} or {kind: "complete", sessionId}. */
export async function received() {
  const response = await fetch(`${FAKE_INGEST.origin}/__received`);
  return response.json();
}

/** The sessions that posted batches, in the order they started (each batch's metadata.timestamp). */
export function sessionIdsIn(log) {
  const started = new Map();
  for (const r of log) {
    if (r.kind === "batch" && !started.has(r.batch.sessionId)) started.set(r.batch.sessionId, r.batch.metadata?.timestamp);
  }
  return [...started].sort((a, b) => a[1] - b[1]).map(([id]) => id);
}

export function batchesOf(log, sessionId) {
  return log.filter((r) => r.kind === "batch" && r.batch.sessionId === sessionId).map((r) => r.batch);
}

/** A session's events, in the order the SDK queued them. */
export function eventsOf(batches) {
  return batches.flatMap((b) => b.events).sort((a, b) => a.seq - b.seq);
}

const path = (url) => {
  const u = new URL(url);
  return u.pathname + u.search;
};

/** The recorded calls to the shop's own API, as "METHOD /path?query", with the call itself. */
export function apiCalls(events) {
  return events
    .filter((e) => e.type === "network" && new URL(e.data.url).pathname.startsWith("/api/"))
    .map((e) => ({ name: `${e.data.method} ${path(e.data.url)}`, call: e.data }));
}

/** Route changes without a page load (a single-page app's), with what moved the page. */
export function routeChanges(events) {
  return events
    .filter((e) => e.type === "dom" && e.data.type === RRWEB_META && e.data.data.cause)
    .map((e) => ({ path: new URL(e.data.data.href).pathname, cause: e.data.data.cause }));
}

/** The pages loaded, from rrweb's own Meta events (one per load; none for a route change). */
export function pageLoads(events) {
  return events
    .filter((e) => e.type === "dom" && e.data.type === RRWEB_META && !e.data.data.cause)
    .map((e) => new URL(e.data.data.href).pathname);
}

/** The value of every field change the recording holds, as recorded. */
export function typedValues(events) {
  return events
    .filter((e) => e.type === "dom" && e.data.type === RRWEB_INCREMENTAL && e.data.data.source === RRWEB_INPUT)
    .map((e) => e.data.data.text);
}

/** How many clicks the recording holds. */
export function clickCount(events) {
  return events.filter(
    (e) => e.type === "dom" && e.data.type === RRWEB_INCREMENTAL && e.data.data.source === RRWEB_MOUSE && e.data.data.type === RRWEB_CLICK,
  ).length;
}
