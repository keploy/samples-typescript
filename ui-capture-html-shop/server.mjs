// The plain-HTML shop's server: node:http alone, no bundler, no framework.
// It serves the shop's pages and scripts, the SDK's dist/ and rrweb's dist/
// as npm installed them, the shop's API under /api, and /keploy-config.js:
// the ingest endpoint and key from .env, for app/keploy.js to import.
//
//   npm start    http://localhost:8080 (PORT and HOST change it)

import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { handleApi } from "./shop-api.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "localhost";

// One HTML file per page: each link loads a page.
const pages = {
  "/": "index.html",
  "/products": "products.html",
  "/cart": "cart.html",
  "/checkout": "checkout.html",
  "/about": "about.html",
};
// URL prefix -> directory served as it is.
const dirs = {
  "/app/": join(here, "app"),
  "/vendor/capture-sdk/": join(here, "node_modules", "@keploy", "capture-sdk", "dist"),
  "/vendor/rrweb/": join(here, "node_modules", "rrweb", "dist"),
};
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

const config =
  `export const endpoint = ${JSON.stringify(process.env.KEPLOY_INGEST_ENDPOINT ?? "")};\n` +
  `export const apiKey = ${JSON.stringify(process.env.KEPLOY_INGEST_KEY ?? "")};\n`;

/** The file a path names, or null: a page, or a file inside one of the served directories. */
function fileFor(pathname) {
  if (pages[pathname]) return join(here, "pages", pages[pathname]);
  for (const [prefix, dir] of Object.entries(dirs)) {
    if (!pathname.startsWith(prefix)) continue;
    const file = join(dir, pathname.slice(prefix.length));
    return file.startsWith(dir + sep) ? file : null;
  }
  return null;
}

createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url ?? "/", "http://localhost");
    decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    let body = "";
    for await (const chunk of req) body += chunk;
    const answer = handleApi(req.method ?? "GET", url, body);
    res.writeHead(answer.status, { "Content-Type": "application/json" }).end(JSON.stringify(answer.body));
    return;
  }
  if (url.pathname === "/keploy-config.js") {
    res.writeHead(200, { "Content-Type": types[".js"], "Cache-Control": "no-store" }).end(config);
    return;
  }

  const file = fileFor(decodeURIComponent(url.pathname));
  try {
    if (!file) throw new Error("not served");
    const content = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" }).end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  }
}).listen(port, host, () => console.log(`Demo Shop on http://${host}:${port}`));
