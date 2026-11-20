// npm test: builds the shop for a local fake ingest (test/fake-ingest.mjs),
// serves it, and checks what the SDK sends. No Keploy account or key needed.
// The test build goes to .next-test/, so it never replaces your own .next/.

import { defineConfig, devices } from "@playwright/test";
import { FAKE_INGEST } from "./test/recording.mjs";

const shop = "http://127.0.0.1:3001";

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
        NEXT_PUBLIC_KEPLOY_INGEST_ENDPOINT: FAKE_INGEST.endpoint,
        NEXT_PUBLIC_KEPLOY_INGEST_KEY: FAKE_INGEST.key,
        SHOP_TEST_BUILD: "1",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      reuseExistingServer: false,
    },
  ],
});
