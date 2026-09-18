import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright drives the dev server over 127.0.0.1; allow its HMR requests.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
