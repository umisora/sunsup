import { spawnSync } from "node:child_process";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

// NEXT_PHASE is not set yet when this file loads; the phase argument is.
function runNodeScript(script: string): void {
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--import", "./scripts/register-ts.mjs", script],
    { stdio: "inherit" },
  );
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${script} exited with status ${result.status}`);
  }
}

export default function nextConfig(phase: string): NextConfig {
  // Client shelf data. Dev and build both compile app/drink/DrinkIndexShelf.tsx, which imports it.
  runNodeScript("scripts/build-drink-shelf.mts");
  if (phase === PHASE_PRODUCTION_BUILD) {
    // `output: "export"` cannot serve a sitemap route. Write the XML into public/
    // before Next copies public/ into out/.
    runNodeScript("scripts/build-sitemaps.mjs");
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
