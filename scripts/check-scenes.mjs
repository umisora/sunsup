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

// STYLISH!'s recommended set, first painted for 4 people toasting with a soft drink: the tag and the
// heading 「乾杯のソフトドリンクは、この3種類で」, three role cards (乾杯用 4本, テーブル用 1本, 食事用 2本 = 7本)
// each with a reason, the drink page's own store links (same URL, same kind) tagged source=list with no
// affiliate parameters and swap buttons for the other drinks of the role, then 「全部で7本」 and the LINE link.
const AFFILIATE = /[?&](tag|ascsubtag|linkCode|aff(iliate)?(_?id)?|scid|a8|afid)=/i;
const unescape = (text) => text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attr = (tag, name) => {
  const match = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return match ? unescape(match[1]) : undefined;
};
const strip = (text) => unescape(text.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, ""));
const ROLES = [
  ["kanpai", "乾杯用", 4],
  ["table", "テーブル用", 1],
  ["meal", "食事用", 2],
];
for (const slug of scenes) {
  const path = `/ba/${slug}/`;
  const html = read(`ba/${slug}/index.html`);
  const start = html.indexOf('data-shopping-list=""');
  if (start < 0 || !html.includes('id="list"') || !/<a href="#list"[^>]*>ソフトドリンクのおすすめを見る/.test(html)) {
    fail(`${path} has no recommended set, or no ソフトドリンクのおすすめを見る link to it`);
    continue;
  }
  if (!/data-shopping-list="" data-headcount="4"/.test(html)) {
    fail(`${path} set is not first painted for 4 people`);
  }
  const part = html.slice(start);
  if (!/<p class="[^"]*">STYLISH!のおすすめ<\/p>/.test(part)) {
    fail(`${path} set has no STYLISH!のおすすめ tag`);
  }
  const heading = /<h2 id="list-title"[^>]*>([\s\S]*?)<\/h2>/.exec(part);
  if (!heading || strip(heading[1]) !== "乾杯のソフトドリンクは、この3種類で") {
    fail(`${path} set heading: ${heading ? strip(heading[1]) : "missing"}`);
  }
  if (!part.includes(">ソフトドリンクで乾杯する人</span>")) {
    fail(`${path} set has no ソフトドリンクで乾杯する人 headcount`);
  }
  const cards = [...part.matchAll(/<li class="[^"]*" data-list-role="([a-z]+)" data-list-slug="([a-z0-9-]+)" data-units="(\d+)">([\s\S]*?)(?=<li class="[^"]*" data-list-role=|<p class="[^"]*" data-total=)/g)];
  if (cards.map((card) => card[1]).join() !== ROLES.map((role) => role[0]).join()) {
    fail(`${path} set cards are ${cards.map((card) => card[1]).join() || "missing"}, not kanpai,table,meal`);
  }
  let total = 0;
  const sent = [];
  for (const [, role, drink, units, body] of cards) {
    const [, label, expected] = ROLES.find((entry) => entry[0] === role) ?? [];
    if (Number(units) !== expected || !body.includes(`>${units}</span>`)) {
      fail(`${path} set: ${role} is ${units} bottles for 4 people, expected ${expected}`);
    }
    total += Number(units);
    if (!body.includes(`>${label}</span>`) || !/<p class="[^"]*">[^<]{6,}。<\/p>/.test(body)) {
      fail(`${path} set: ${role} card has no ${label} tag or no reason`);
    }
    if (!/<img src="\/drinks\/[a-z0-9-]+\.webp"/.test(body)) {
      fail(`${path} set: ${drink} card has no still`);
    }
    const swaps = [...body.matchAll(/<button[^>]*data-list-swap="([a-z0-9-]+)"[^>]*>/g)];
    if (swaps.length < 2 || !swaps.some((tag) => tag[1] === drink && /aria-pressed="true"/.test(tag[0]) && /\sdisabled=""/.test(tag[0])) || !swaps.every((tag) => /aria-label="[^"]+に替える"/.test(tag[0]))) {
      fail(`${path} set: ${role} has ${swaps.length} swap button(s), or the pick is not marked pressed`);
    }
    if (!/>ほかの候補<\/span>/.test(body)) {
      fail(`${path} set: ${role} has no ほかの候補`);
    }
    const drinkPage = join("out", "drink", drink, "index.html");
    if (!existsSync(drinkPage)) {
      fail(`${path} set names ${drink}, which has no drink page`);
    }
    const map = existsSync(drinkPage) ? JSON.parse((readFileSync(drinkPage, "utf8").match(/<script[^>]*id="out-links"[^>]*>([\s\S]*?)<\/script>/) ?? [])[1] ?? "{}") : {};
    const stores = [...body.matchAll(/<a [^>]*data-out-source="[^"]*"[^>]*>/g)].map((m) => m[0]);
    if (stores.length === 0) {
      fail(`${path} set: ${drink} has no store link`);
    }
    for (const tag of stores) {
      const href = attr(tag, "href") ?? "";
      if (attr(tag, "data-out-slug") !== drink || attr(tag, "data-out-source") !== "list") {
        fail(`${path} set: ${href} is not tagged as ${drink} from the list`);
      }
      if (map.links?.[href] !== attr(tag, "data-out-kind") || attr(tag, "data-out-kind") === "official") {
        fail(`${path} set: ${drink} links ${href} as ${attr(tag, "data-out-kind")}, the drink page has ${map.links?.[href]}`);
      }
      if (AFFILIATE.test(href)) {
        fail(`${path} set: affiliate parameter in ${href}`);
      }
    }
    sent.push(`　${units}本（${label}）\n`);
  }
  const totalTag = /<p class="[^"]*" data-total="(\d+)">([\s\S]*?)<\/p>/.exec(part);
  if (!totalTag || Number(totalTag[1]) !== total || total !== 7 || strip(totalTag[2]) !== `全部で${total}本`) {
    fail(`${path} total is not 「全部で7本」: ${totalTag ? strip(totalTag[2]) : "missing"}`);
  }
  const line = /<a href="(https:\/\/line\.me\/R\/share\?text=[^"]+)"[^>]*data-list-line="">([^<]*)<\/a>/.exec(part);
  const text = line ? decodeURIComponent(unescape(line[1]).split("text=")[1]) : "";
  if (!line || line[2] !== "買い出しの人にLINEで送る" || !/^.+のソフトドリンク（4人分）\n/.test(text) || !text.includes(`\n全部で${total}本\n`) || !text.endsWith(`${origin}${path}`) || sent.some((entry) => !text.includes(entry))) {
    fail(`${path} LINE link does not carry the set: ${JSON.stringify(text.slice(0, 80))}`);
  }
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(`✗ ${message}`);
  }
  process.exit(1);
}
console.log(`scenes ok: ${scenes.length} scene page(s), each with a recommended set`);
