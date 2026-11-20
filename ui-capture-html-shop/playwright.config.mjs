// npm test: serves the shop for a local fake ingest (test/fake-ingest.mjs)
// and checks what the SDK sends. No Keploy account or key needed.
// The test server runs on port 8081, beside your own on 8080.

import { defineConfig, devices } from "@playwright/test";
import { FAKE_INGEST } from "./test/recording.mjs";

const shop = "http://127.0.0.1:8081";

export default defineConfig({
  testDir: "test",
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { ...devices["Desktop Chrome"], baseURL: shop, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node test/fake-ingest.mjs",
      url: `${FAKE_INGEST.origin}/__health`,
      env: { FAKE_INGEST_KEY: FAKE_INGEST.key },
      reuseExistingServer: false,
    },
    {
      command: "npm run test:serve",
      url: shop,
      timeout: 180_000,
      env: {
        KEPLOY_INGEST_ENDPOINT: FAKE_INGEST.endpoint,
        KEPLOY_INGEST_KEY: FAKE_INGEST.key,
        HOST: "127.0.0.1",
        PORT: "8081",
      },
      reuseExistingServer: false,
    },
  ],
});
