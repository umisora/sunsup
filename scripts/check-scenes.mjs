// Checks the exported scene pages under /ba/<slug>/ (run after `npm run build`).
// Listed drinks must be public with a real still, the ItemList must match the links on the page,
// the breadcrumbs must end at the page, the page must be in the sitemap, and each drink must link back.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const failures = [];
const fail = (message) => failures.push(message);
const read = (path) => readFileSync(join("out", path), "utf8");

const sitemap = read("sitemap.xml");
const origin = (read("robots.txt").match(/Sitemap: (https:\/\/[^/]+)\//) ?? [])[1] ?? "";
const scenes = readdirSync(join("out", "ba"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "office")
  .map((entry) => entry.name);

if (scenes.length === 0) {
  fail("no scene pages under out/ba/");
}

for (const slug of scenes) {
  const path = `/ba/${slug}/`;
  const html = read(`ba/${slug}/index.html`);
  const url = `${origin}${path}`;
  if (!html.includes(`<link rel="canonical" href="${url}"/>`)) {
    fail(`${path} is missing its canonical`);
  }
  if (!sitemap.includes(`<loc>${url}</loc>`)) {
    fail(`${path} is not in the sitemap`);
  }
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const list = blocks.find((item) => item["@type"] === "ItemList");
  const crumbs = blocks.find((item) => item["@type"] === "BreadcrumbList");
  if (!list || !crumbs || blocks.some((item) => item["@context"] !== "https://schema.org")) {
    fail(`${path} needs an ItemList and a BreadcrumbList on https://schema.org`);
    continue;
  }
  if (crumbs.itemListElement.at(-1)?.item !== url) {
    fail(`${path} breadcrumbs do not end at the page`);
  }
  const linked = [...new Set([...html.matchAll(/href="\/drink\/([a-z0-9-]+)\/"/g)].map((m) => m[1]))];
  const listed = list.itemListElement.map((item, index) => {
    if (item["@type"] !== "ListItem" || item.position !== index + 1) {
      fail(`${path} ItemList entry ${index + 1} is not a numbered ListItem`);
    }
    return item.url.replace(`${origin}/drink/`, "").replace(/\/$/, "");
  });
  if (list.numberOfItems !== listed.length || listed.length < 6) {
    fail(`${path} ItemList has ${listed.length} drinks`);
  }
  for (const drink of listed) {
    const page = join("out", "drink", drink, "index.html");
    if (!existsSync(page)) {
      fail(`${path} lists ${drink}, which has no public page`);
      continue;
    }
    if (!linked.includes(drink)) {
      fail(`${path} ItemList has ${drink} but the page does not link it`);
    }
    const drinkHtml = readFileSync(page, "utf8");
    if (!drinkHtml.includes(`href="${path}"`)) {
      fail(`/drink/${drink}/ does not link back to ${path}`);
    }
    const still = drinkHtml.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? "";
    if (!still.includes("/drinks/") || still.includes("fallback")) {
      fail(`${path} lists ${drink} without a real still`);
    }
  }
}

// A scene hero made from product stills: every drink in it is on that page, and no print pixel was repainted.
const fidelityPath = join(process.cwd(), "stills", "scene-hero-fidelity.json");
if (existsSync(fidelityPath)) {
  const fidelity = JSON.parse(readFileSync(fidelityPath, "utf8"));
  for (const [scene, drinks] of Object.entries(fidelity)) {
    const page = join("out", "ba", scene, "index.html");
    const html = existsSync(page) ? readFileSync(page, "utf8") : "";
    for (const [drink, result] of Object.entries(drinks)) {
      if (!html.includes(`href="/drink/${drink}/"`)) {
        fail(`hero of /ba/${scene}/ shows ${drink}, which the page does not list`);
      }
      if (result.print_maxdiff !== 0) {
        fail(`hero of /ba/${scene}/ repainted the print of ${drink}`);
      }
    }
  }
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(`✗ ${message}`);
  }
  process.exit(1);
}
console.log(`scenes ok: ${scenes.length} scene page(s)`);
