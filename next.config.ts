import { spawnSync } from "node:child_process";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

// `output: "export"` cannot serve a sitemap route. Write the XML into public/
// while Next is loading this config, before it copies public/ into out/.
// NEXT_PHASE is not set yet at that moment; the phase argument is.
function buildSitemaps(): void {
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--import", "./scripts/register-ts.mjs", "scripts/build-sitemaps.mjs"],
    { stdio: "inherit" },
  );
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`scripts/build-sitemaps.mjs exited with status ${result.status}`);
  }
}

export default function nextConfig(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    buildSitemaps();
  }
  return {
    output: "export",
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    reactStrictMode: true,
  };
}
