import type { IncomingMessage, ServerResponse } from "node:http";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { handleApi } from "./shop-api.mjs";

// The shop's API, served by Vite itself under /api, for `npm run dev` and
// `npm run preview` alike: no separate backend to start.
function api(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (!url.pathname.startsWith("/api/")) return next();
  let body = "";
  req.setEncoding("utf8");
  req.on("data", (chunk: string) => (body += chunk));
  req.on("end", () => {
    const answer = handleApi(req.method ?? "GET", url, body);
    res.statusCode = answer.status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(answer.body));
  });
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "shop-api",
      configureServer(server) {
        server.middlewares.use(api);
      },
      configurePreviewServer(server) {
        server.middlewares.use(api);
      },
    },
  ],
});
