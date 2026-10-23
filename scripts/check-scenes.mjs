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

// The organiser's shopping list: on every scene page, first painted for 10 people, units rounded up
// from each drink's people per bottle, store links that are the drink page's own (same URL, same kind),
// tagged for /api/click with source=list, no affiliate parameters, and a LINE link carrying the list.
const AFFILIATE = /[?&](tag|ascsubtag|linkCode|aff(iliate)?(_?id)?|scid|a8|afid)=/i;
const unescape = (text) => text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attr = (tag, name) => {
  const match = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return match ? unescape(match[1]) : undefined;
};
for (const slug of scenes) {
  const path = `/ba/${slug}/`;
  const html = read(`ba/${slug}/index.html`);
  const start = html.indexOf('data-shopping-list=""');
  if (start < 0 || !html.includes('id="list"') || !html.includes('href="#list"')) {
    fail(`${path} has no shopping list, or no link to it`);
    continue;
  }
  if (!/data-shopping-list="" data-headcount="10"/.test(html)) {
    fail(`${path} shopping list is not first painted for 10 people`);
  }
  const part = html.slice(start);
  const lines = [...part.matchAll(/<li[^>]*data-list-slug="([a-z0-9-]+)" data-people="(\d+)" data-share="(\d+)" data-units="(\d+)"[^>]*>([\s\S]*?)<\/ul><\/li>/g)];
  if (lines.length === 0) {
    fail(`${path} shopping list has no lines`);
  }
  const shares = lines.reduce((sum, line) => sum + Number(line[3]), 0);
  if (lines.length > 0 && shares !== 10) {
    fail(`${path} shopping list shares add up to ${shares}, not 10`);
  }
  let total = 0;
  for (const [, drink, people, share, units, body] of lines) {
    const expected = Number(people) === 0 ? 1 : Math.max(1, Math.ceil(Number(share) / Number(people)));
    if (Number(units) !== expected) {
      fail(`${path} list: ${drink} is ${units} bottles for ${share} people at ${people} a bottle, expected ${expected}`);
    }
    total += Number(units);
    if (!html.includes(`href="/drink/${drink}/"`)) {
      fail(`${path} list names ${drink}, which the page does not show`);
    }
    const drinkPage = join("out", "drink", drink, "index.html");
    const map = existsSync(drinkPage) ? JSON.parse((readFileSync(drinkPage, "utf8").match(/<script[^>]*id="out-links"[^>]*>([\s\S]*?)<\/script>/) ?? [])[1] ?? "{}") : {};
    const stores = [...body.matchAll(/<a [^>]*data-out-source="[^"]*"[^>]*>/g)].map((m) => m[0]);
    if (stores.length === 0) {
      fail(`${path} list: ${drink} has no store link`);
    }
    for (const tag of stores) {
      const href = attr(tag, "href") ?? "";
      if (attr(tag, "data-out-slug") !== drink || attr(tag, "data-out-source") !== "list") {
        fail(`${path} list: ${href} is not tagged as ${drink} from the list`);
      }
      if (map.links?.[href] !== attr(tag, "data-out-kind") || attr(tag, "data-out-kind") === "official") {
        fail(`${path} list: ${drink} links ${href} as ${attr(tag, "data-out-kind")}, the drink page has ${map.links?.[href]}`);
      }
      if (AFFILIATE.test(href)) {
        fail(`${path} list: affiliate parameter in ${href}`);
      }
    }
  }
  if (!part.includes(`合計 <strong>${total}<!-- -->本</strong>`) && !part.includes(`合計 <strong>${total}本</strong>`)) {
    fail(`${path} list total is not ${total}`);
  }
  const line = /<a href="(https:\/\/line\.me\/R\/share\?text=[^"]+)"[^>]*data-list-line=""/.exec(part);
  const text = line ? decodeURIComponent(unescape(line[1]).split("text=")[1]) : "";
  if (!text.includes("（10人分）") || !text.includes(`合計 ${total}本`) || !text.endsWith(`${origin}${path}`) || lines.some(([, , , , units]) => !text.includes(` ${units}本`))) {
    fail(`${path} LINE link does not carry the list: ${text.slice(0, 80)}`);
  }
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(`✗ ${message}`);
  }
  process.exit(1);
}
console.log(`scenes ok: ${scenes.length} scene page(s), each with a shopping list`);
