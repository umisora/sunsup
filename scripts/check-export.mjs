import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const failures = [];

function fail(message) {
  failures.push(message);
}

function read(path) {
  const file = join("out", path);
  if (!existsSync(file)) {
    fail(`missing ${file}`);
    return "";
  }
  return readFileSync(file, "utf8");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") {
        i += 1;
      }
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

const home = read("index.html");
read("ba/office/index.html");
if (!home.includes("<title>sunsup</title>") || home.includes("drinkup") || home.includes("Drinkup")) {
  fail("home no longer uses the sunsup name");
}
read("about/index.html");
const shell = read("drink/shell/index.html");
const office = read("ba/office/index.html");

if (shell.includes("amazon.co.jp") || shell.includes("rakuten.co.jp") || shell.includes("公式サイト")) {
  fail("shell includes a store link");
}
if (shell.includes("KIMINO") || shell.includes("クラノオト")) {
  fail("shell includes a product name");
}
const cup = office.match(/<a\b[^>]*href="([^"]*)"[^>]*>\s*<span>一杯へ<\/span>/);
if (!cup || cup[1] !== "/drink/kimino-yuzu/") {
  fail(`office 一杯へ links to ${cup ? cup[1] : "nothing"}`);
}
if (office.includes('href="/drink/shell/"')) {
  fail("office links to the drink shell");
}
if (office.includes("drinkup") || office.includes("Drinkup") || !office.includes("sunsup")) {
  fail("office no longer uses the sunsup name");
}

const OFFICE_ENTRIES = [
  "kimino-yuzu",
  "kuranooto-koshu",
  "fujiya-nectar-peach",
  "suntory-oolong-340",
  "kitayama-jabarush",
  "sanpellegrino-aranciata",
];
for (const slug of OFFICE_ENTRIES) {
  if (!office.includes(`href="/drink/${slug}/"`)) {
    fail(`office is missing /drink/${slug}/`);
  }
}

function categoryKey(category) {
  if (category === "クラフト・瓶もの" || category === "クラフト／瓶もの") {
    return "クラフト・瓶";
  }
  return category;
}

const AMAZON_PRODUCT = /^\/(?:dp|gp\/product|gp\/aw\/d)\/[A-Za-z0-9]{10}(?:\/|$)/;

function isAmazonProduct(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (host === "amazon.co.jp" || host === "www.amazon.co.jp") && AMAZON_PRODUCT.test(parsed.pathname);
  } catch {
    return false;
  }
}

function isRakutenProduct(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase() !== "item.rakuten.co.jp") {
      return false;
    }
    return parsed.pathname.split("/").filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}

function drinkTitle(drink) {
  return `${drink["品名"]}｜${drink["カテゴリ"]}｜sunsup`;
}

function drinkDescription(drink) {
  return `${drink["品名"]}。${drink["カテゴリ"]}。${drink["場"]}`;
}

/** React escapes `&` in text and attributes. The catalog copy itself stays unchanged. */
function htmlText(value) {
  return value.replaceAll("&", "&amp;");
}

const table = parseCsv(readFileSync(join("data", "drinks.csv"), "utf8"));
const header = table[0];
const drinks = table.slice(1).map((row) => Object.fromEntries(header.map((column, index) => [column, (row[index] ?? "").trim()])));
if (drinks.length !== 577) {
  fail(`expected 577 drink rows, found ${drinks.length}`);
}
const publicDrinks = drinks.filter((drink) => drink["公開"] === "1");
const hiddenDrinks = drinks.filter((drink) => drink["公開"] === "0");
if (publicDrinks.length !== 544) {
  fail(`expected 544 public drink rows, found ${publicDrinks.length}`);
}
if (hiddenDrinks.length !== 33) {
  fail(`expected 33 hidden drink rows, found ${hiddenDrinks.length}`);
}
if (drinks.some((drink) => drink["カテゴリ"] === "クラフト／瓶もの")) {
  fail("craft bottle category still uses the slash label");
}
const craftCount = drinks.filter((drink) => drink["カテゴリ"] === "クラフト・瓶もの").length;
if (craftCount !== 89) {
  fail(`expected 89 craft bottle rows, found ${craftCount}`);
}
const descriptions = drinks.map((drink) => drinkDescription(drink));
if (new Set(descriptions).size !== drinks.length || new Set(drinks.map((drink) => drinkTitle(drink))).size !== drinks.length) {
  fail("drink titles or descriptions are not unique");
}
const entryKeys = OFFICE_ENTRIES.map((slug) => {
  const drink = publicDrinks.find((row) => row.slug === slug);
  return drink ? categoryKey(drink["カテゴリ"]) : "";
});
if (entryKeys.some((key) => key === "") || new Set(entryKeys).size !== OFFICE_ENTRIES.length) {
  fail("office entries are not one drink per category");
}

const slugs = publicDrinks.map((drink) => drink.slug);
const hiddenSlugs = hiddenDrinks.map((drink) => drink.slug);
const pages = readdirSync(join("out", "drink"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "shell")
  .map((entry) => entry.name)
  .sort();

if (pages.length !== slugs.length) {
  fail(`expected ${slugs.length} public drink pages, found ${pages.length}`);
}

for (const slug of slugs) {
  if (!pages.includes(slug)) {
    fail(`missing out/drink/${slug}/index.html`);
  }
}

for (const slug of hiddenSlugs) {
  if (pages.includes(slug) || existsSync(join("out", "drink", slug, "index.html"))) {
    fail(`hidden slug was exported: ${slug}`);
  }
}

function isHttp(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function publishedAmazon(url) {
  return url && isAmazonProduct(url) ? url : "";
}

function publishedRakuten(url) {
  return url && isRakutenProduct(url) ? url : "";
}

function publishedHttp(url) {
  return url && isHttp(url) ? url : "";
}

function hasHref(html, url) {
  return html.includes(url) || html.includes(url.replaceAll("&", "&amp;"));
}

for (const drink of publicDrinks) {
  const html = read(`drink/${drink.slug}/index.html`);
  if (!html) {
    continue;
  }
  const name = htmlText(drink["品名"]);
  if (!html.includes(name)) {
    fail(`${drink.slug} is missing its name`);
  }
  const title = htmlText(drinkTitle(drink));
  const description = htmlText(drinkDescription(drink));
  if (!html.includes(`<title>${title}</title>`)) {
    fail(`${drink.slug} is missing its title`);
  }
  if (!html.includes(`<meta name="description" content="${description}"/>`)) {
    fail(`${drink.slug} is missing its description`);
  }
  if (!html.includes(`<meta property="og:title" content="${title}"/>`)) {
    fail(`${drink.slug} is missing its Open Graph title`);
  }
  if (!html.includes(`<meta property="og:description" content="${description}"/>`)) {
    fail(`${drink.slug} is missing its Open Graph description`);
  }
  if (html.includes("drinkup") || html.includes("Drinkup")) {
    fail(`${drink.slug} renames the site`);
  }
  if (html.includes("fallback-") || html.includes("search.rakuten.co.jp") || html.includes("/s?k=")) {
    fail(`${drink.slug} publishes a fallback still or a search URL`);
  }
  const siblings = publicDrinks.filter((other) => other.slug !== drink.slug && categoryKey(other["カテゴリ"]) === categoryKey(drink["カテゴリ"]));
  if (siblings.length > 0 && !siblings.some((other) => html.includes(`href="/drink/${other.slug}/"`))) {
    fail(`${drink.slug} does not link to another drink in its category`);
  }
  if (!html.includes('href="/drink/"')) {
    fail(`${drink.slug} does not link to the drink list`);
  }
  for (const slug of hiddenSlugs) {
    if (html.includes(`href="/drink/${slug}/"`)) {
      fail(`${drink.slug} links to hidden ${slug}`);
    }
  }
  const still = drink["静物URL"];
  if (still.includes("fallback-")) {
    fail(`${drink.slug} still points at a fallback image`);
  }
  if (still.startsWith("/drinks/") || still.startsWith("http://") || still.startsWith("https://")) {
    const image = still.startsWith("/") ? `https://sunsup-dv4.pages.dev${still}` : still;
    if (!html.includes(`<meta property="og:image" content="${image}"/>`)) {
      fail(`${drink.slug} is missing its Open Graph image`);
    }
  } else if (html.includes('property="og:image"')) {
    fail(`${drink.slug} has an Open Graph image without a still`);
  }
  const amazon = publishedAmazon(drink["AmazonURL"]);
  const rakuten = publishedRakuten(drink["楽天URL"]);
  const direct = publishedHttp(drink["直販URL"]);
  const other = publishedHttp(drink["その他URL"]);
  const official = publishedHttp(drink["公式URL"]);
  const primary = amazon || rakuten || direct || other;
  const primaryCount = html.split('data-store-primary="true"').length - 1;
  if (primary) {
    if (primaryCount !== 1) {
      fail(`${drink.slug} should have one primary store CTA`);
    }
    const at = html.indexOf('data-store-primary="true"');
    const slice = html.slice(Math.max(0, at - 1200), at + 400);
    const encoded = primary.replaceAll("&", "&amp;");
    if (!slice.includes(primary) && !slice.includes(encoded)) {
      fail(`${drink.slug} primary CTA is not the first purchase link`);
    }
  } else if (primaryCount !== 0 && !official) {
    fail(`${drink.slug} renders a store CTA without a product link`);
  }
  if (!html.includes("次の飲み会に、") || !html.includes("これを置く。")) {
    fail(`${drink.slug} is missing the close line`);
  }
  if (!html.includes("/ 544") || html.includes("/ 577")) {
    fail(`${drink.slug} catalog count is not the public 544`);
  }
  const stores = [
    [official, "公式サイト"],
    [amazon, "Amazon"],
    [rakuten, "楽天"],
    [direct, "公式ショップ"],
    [other, other ? null : "その他の通販"],
  ];
  for (const [url, emptyMarker] of stores) {
    if (url) {
      if (!hasHref(html, url)) {
        fail(`${drink.slug} is missing ${url}`);
      }
    } else if (emptyMarker && html.includes(emptyMarker)) {
      fail(`${drink.slug} renders an empty ${emptyMarker}`);
    }
  }
  if (html.includes("tag=") || html.includes('rel="sponsored"')) {
    fail(`${drink.slug} includes an affiliate marker`);
  }
  if (amazon || rakuten || direct || other || official) {
    if (!html.includes('rel="noopener nofollow"')) {
      fail(`${drink.slug} store links are missing rel="noopener nofollow"`);
    }
    if (!html.includes('target="_blank"')) {
      fail(`${drink.slug} store links are missing target="_blank"`);
    }
  }
  if (still.startsWith("/")) {
    const marker = `src="${still}"`;
    if (!html.includes(marker)) {
      fail(`${drink.slug} is missing ${marker}`);
    }
    const asset = join("out", still.slice(1));
    if (!existsSync(asset)) {
      fail(`${drink.slug} still is missing from the export: ${asset}`);
    }
  } else if (still && !html.includes(`src="${still}"`)) {
    fail(`${drink.slug} is missing its still`);
  }
}

const list = read("drink/index.html");
if (!list.includes("<title>一杯の一覧｜sunsup</title>")) {
  fail("drink list is missing its title");
}
for (const slug of slugs) {
  if (!list.includes(`href="/drink/${slug}/"`)) {
    fail(`drink list is missing /drink/${slug}/`);
  }
}
for (const slug of hiddenSlugs) {
  if (list.includes(`href="/drink/${slug}/"`)) {
    fail(`drink list includes hidden /drink/${slug}/`);
  }
}
if (list.includes("fallback-") || list.includes("drinkup") || list.includes("Drinkup")) {
  fail("drink list uses a fallback still or the wrong name");
}
if (!home.includes('href="/drink/"') || !office.includes('href="/drink/"')) {
  fail("home or office does not link to the drink list");
}
if (!home.includes("544本") || home.includes("577本")) {
  fail("home count is not the public 544");
}
if (!list.includes("544本") || list.includes("577本")) {
  fail("drink list count is not the public 544");
}
if (shell.includes('data-store-primary="true"')) {
  fail("shell has a store CTA");
}

const sitemap = read("sitemap.xml");
const robots = read("robots.txt");
if (!robots.includes("Sitemap: https://sunsup-dv4.pages.dev/sitemap.xml")) {
  fail("robots.txt is missing the sitemap");
}
if (!sitemap.includes("<loc>https://sunsup-dv4.pages.dev/drink/</loc>")) {
  fail("sitemap is missing the drink list");
}
for (const slug of slugs) {
  if (!sitemap.includes(`<loc>https://sunsup-dv4.pages.dev/drink/${slug}/</loc>`)) {
    fail(`sitemap is missing /drink/${slug}/`);
  }
}
for (const slug of hiddenSlugs) {
  if (sitemap.includes(`/drink/${slug}/`)) {
    fail(`sitemap includes hidden /drink/${slug}/`);
  }
  if (office.includes(`href="/drink/${slug}/"`) || home.includes(`href="/drink/${slug}/"`)) {
    fail(`home or office links to hidden ${slug}`);
  }
}
if (sitemap.includes("drinkup") || sitemap.includes("/drink/shell")) {
  fail("sitemap names the wrong brand or the drink shell");
}

for (const drink of hiddenDrinks) {
  const still = drink["静物URL"];
  if (still.startsWith("/drinks/")) {
    const asset = join("public", still.slice(1));
    if (!existsSync(asset)) {
      fail(`hidden ${drink.slug} still was deleted: ${asset}`);
    }
  }
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(message);
  }
  process.exit(1);
}

console.log(`export ok: ${slugs.length} public drink pages`);
