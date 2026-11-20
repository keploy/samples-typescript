// A stand-in for Keploy's ingest, for the smoke test only: it takes what the
// SDK posts, keeps it in memory and answers as the real ingest does, so the
// test needs no Keploy account and no key. It also serves what it received,
// at GET /__received, for the test to read.
//
//   POST /ui/v1/ingest                    a batch (gzipped or not) -> {ok, sessionId}
//   POST /ui/v1/sessions/<id>/complete    -> {ok, sessionId, status}
//
// Both need the X-API-Key header the server was started with
// (FAKE_INGEST_KEY). Port: FAKE_INGEST_PORT, 8787 by default.

import { createServer } from "node:http";
import { gunzipSync } from "node:zlib";

const port = Number(process.env.FAKE_INGEST_PORT || 8787);
const key = process.env.FAKE_INGEST_KEY;
if (!key) throw new Error("set FAKE_INGEST_KEY");

// What arrived, in order: {kind: "batch", batch} or {kind: "complete", sessionId}.
// A batch sent again under the same batchId (a retry) is kept once, as the real ingest does.
const received = [];
const batchIds = new Set();

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Content-Encoding, X-API-Key",
};

createServer(async (req, res) => {
  const send = (status, body) => {
    res.writeHead(status, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks);
  const { pathname } = new URL(req.url ?? "/", "http://fake-ingest");

  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    return res.end();
  }
  if (req.method === "GET" && pathname === "/__health") return send(200, { ok: true });
  if (req.method === "GET" && pathname === "/__received") return send(200, received);
  if (req.headers["x-api-key"] !== key) return send(401, { error: "invalid API key" });

  if (req.method === "POST" && pathname === "/ui/v1/ingest") {
    const text = (req.headers["content-encoding"] === "gzip" ? gunzipSync(raw) : raw).toString("utf8");
    const batch = JSON.parse(text);
    if (!batchIds.has(batch.batchId)) {
      batchIds.add(batch.batchId);
      received.push({ kind: "batch", batch });
    }
    return send(200, { ok: true, sessionId: batch.sessionId });
  }

  const done = /^\/ui\/v1\/sessions\/([^/]+)\/complete$/.exec(pathname);
  if (req.method === "POST" && done) {
    received.push({ kind: "complete", sessionId: done[1] });
    return send(200, { ok: true, sessionId: done[1], status: "COMPLETED" });
  }

  send(404, { error: "not found" });
}).listen(port, "127.0.0.1", () => console.log(`fake ingest on http://127.0.0.1:${port}`));
