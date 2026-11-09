// Fails the build when the two sitemaps are not an exact split of the exported pages.
// Run after `next build`. /drink/shell/ is built and stays out of the sitemap, as before.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ORIGIN = "https://stylish.sunsup.me";
// The shell is an empty template. trailingSlash also writes out/404/index.html.
// Neither was in the previous sitemap.
const EXCLUDED_ROUTES = new Set(["/drink/shell/", "/404/"]);
const DRINK_LOC = /^https:\/\/stylish\.sunsup\.me\/drink\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const failures = [];
const fail = (message) => failures.push(message);

function read(path) {
  return readFileSync(join("out", path), "utf8");
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);
}

function routesFromExport() {
  const routes = [];
  const walk = (dir, route) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name === "_next" || entry.name === "drinks" || entry.name === "images" || entry.name === "fonts" || entry.name === "brand" || entry.name === "og") {
          continue;
        }
        walk(join(dir, entry.name), `${route}${entry.name}/`);
      } else if (entry.name === "index.html") {
        routes.push(route);
      }
    }
  };
  walk("out", "/");
  return routes.filter((route) => !EXCLUDED_ROUTES.has(route)).map((route) => `${ORIGIN}${route}`);
}

let indexXml = "";
let pagesXml = "";
let drinksXml = "";
try {
  indexXml = read("sitemap.xml");
  pagesXml = read("sitemap-pages.xml");
  drinksXml = read("sitemap-drinks.xml");
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
  for (const message of failures) {
    console.error(`✗ ${message}`);
  }
  process.exit(1);
}

const robots = readFileSync(join("out", "robots.txt"), "utf8");
if (!robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`)) {
  fail("robots.txt Sitemap line is not the sitemap index");
}
if (!indexXml.includes("<sitemapindex") || indexXml.includes("<urlset") || indexXml.includes("<lastmod>")) {
  fail("sitemap.xml must be a sitemap index with no urlset and no lastmod");
}
const indexLocs = locs(indexXml);
const expectedIndex = [`${ORIGIN}/sitemap-pages.xml`, `${ORIGIN}/sitemap-drinks.xml`];
if (indexLocs.join("\n") !== expectedIndex.join("\n")) {
  fail(`sitemap index locs are ${indexLocs.join(", ") || "empty"}`);
}

function entries(xml, file) {
  const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
  if (blocks.length === 0) {
    fail(`${file} has no <url>`);
  }
  return blocks.map((block) => {
    const found = [...block.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);
    const lastmods = [...block.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((match) => match[1]);
    if (found.length !== 1) {
      fail(`${file} url has ${found.length} locs`);
    }
    if (lastmods.length > 1) {
      fail(`${file} url has ${lastmods.length} lastmods`);
    }
    const loc = found[0] ?? "";
    const lastmod = lastmods[0] ?? null;
    if (lastmod != null && (!DAY.test(lastmod) || lastmod > today)) {
      fail(`${loc} lastmod ${lastmod} is not a YYYY-MM-DD on or before ${today} (Asia/Tokyo)`);
    }
    return loc;
  });
}

const pageLocs = indexXml ? entries(pagesXml, "sitemap-pages.xml") : [];
const drinkLocs = indexXml ? entries(drinksXml, "sitemap-drinks.xml") : [];
const seen = new Map();
for (const loc of [...pageLocs, ...drinkLocs]) {
  seen.set(loc, (seen.get(loc) ?? 0) + 1);
}
const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([loc]) => loc);
for (const loc of duplicates.slice(0, 20)) {
  fail(`duplicate sitemap url ${loc}`);
}
if (duplicates.length > 20) {
  fail(`…and ${duplicates.length - 20} more duplicate sitemap urls`);
}

for (const loc of pageLocs) {
  if (DRINK_LOC.test(loc)) {
    fail(`sitemap-pages.xml lists a drink page ${loc}`);
  }
}
for (const loc of drinkLocs) {
  if (!DRINK_LOC.test(loc)) {
    fail(`sitemap-drinks.xml lists a non-drink url ${loc}`);
  }
}

const expected = new Set(routesFromExport());
const actual = new Set([...pageLocs, ...drinkLocs]);
const missing = [...expected].filter((loc) => !actual.has(loc)).sort();
const extra = [...actual].filter((loc) => !expected.has(loc)).sort();
for (const loc of missing.slice(0, 20)) {
  fail(`built page missing from sitemaps: ${loc}`);
}
for (const loc of extra.slice(0, 20)) {
  fail(`sitemap url has no built page: ${loc}`);
}
if (missing.length > 20 || extra.length > 20) {
  fail(`…${missing.length} missing, ${extra.length} extra`);
}
if (actual.size !== pageLocs.length + drinkLocs.length) {
  fail("sitemap union collapsed duplicate urls");
}
if ([...actual].some((loc) => loc.includes("/drink/shell"))) {
  fail("sitemap lists /drink/shell/");
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(`✗ ${message}`);
  }
  process.exit(1);
}

const lastmods = [...pagesXml.matchAll(/<lastmod>/g), ...drinksXml.matchAll(/<lastmod>/g)].length;
console.log(`sitemaps ok: ${pageLocs.length} pages + ${drinkLocs.length} drinks = ${actual.size} urls, lastmod on ${lastmods}`);
