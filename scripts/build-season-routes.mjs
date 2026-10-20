// Writes public/_routes.json so the season Pages Function runs only on drink pages that have
// seasonal stills (data/still-seasons.json). Everything else stays plain static.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const manifest = JSON.parse(readFileSync(join("data", "still-seasons.json"), "utf8"));
const slugs = Object.keys(manifest.drinks).sort();
const routes = {
  version: 1,
  include: ["/api/*", ...slugs.map((slug) => `/drink/${slug}/`)],
  exclude: [],
};
writeFileSync(join("public", "_routes.json"), `${JSON.stringify(routes, null, 2)}\n`);
console.log(`[season-routes] ${slugs.length} drink pages`);
