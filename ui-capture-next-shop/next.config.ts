import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `npm test` builds the shop for its fake ingest into .next-test, so it
  // never replaces your own build in .next.
  distDir: process.env.SHOP_TEST_BUILD === "1" ? ".next-test" : ".next",
};

export default nextConfig;
