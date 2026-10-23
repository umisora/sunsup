import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { isGenericProduct } from "./generic-rule.mjs";

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
if (!home.includes("<title>STYLISH!</title>") || home.includes("drinkup") || home.includes("Drinkup")) {
  fail("home no longer uses the STYLISH! name");
}
const manifest = read("manifest.webmanifest");
if (!manifest.includes('"name":"STYLISH!"') || !manifest.includes('"short_name":"STYLISH!"')) {
  fail("manifest is missing the STYLISH! name");
}
for (const asset of [
  "icon.png",
  "icon-192.png",
  "icon-512.png",
  "brand/stylish-logo.webp",
  "brand/stylish-mark.webp",
  "brand/stylish-wordmark.webp",
  "og/stylish.jpg",
]) {
  if (!existsSync(join("out", asset))) {
    fail(`missing brand asset out/${asset}`);
  }
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
const cup = office.match(/<a\b[^>]*href="([^"]*)"[^>]*>\s*<span>ドリンクを見る<\/span>/);
if (!cup || cup[1] !== "/drink/kimino-yuzu/") {
  fail(`office ドリンクを見る links to ${cup ? cup[1] : "nothing"}`);
}
if (office.includes('href="/drink/shell/"')) {
  fail("office links to the drink shell");
}
if (office.includes("drinkup") || office.includes("Drinkup") || !office.includes("STYLISH!")) {
  fail("office no longer uses the STYLISH! name");
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
  return `${drink["品名"]}｜${drink["カテゴリ"]}｜STYLISH!`;
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
if (!header.includes("定番")) {
  fail("drinks.csv is missing the 定番 column");
}
const drinks = table.slice(1).map((row) => Object.fromEntries(header.map((column, index) => [column, (row[index] ?? "").trim()])));
const genericDrinks = drinks.filter((drink) => drink["定番"] === "1");
for (const drink of drinks) {
  const flag = drink["定番"];
  if (flag !== "0" && flag !== "1") {
    fail(`${drink.slug} 定番 must be 0 or 1`);
    continue;
  }
  if ((flag === "1") !== isGenericProduct(drink["品名"])) {
    fail(`${drink.slug} 定番 disagrees with scripts/generic-rule.mjs`);
  }
}
if (genericDrinks.length < 40) {
  fail(`expected a recorded set of convenience-store staples, found ${genericDrinks.length}`);
}
const poolPath = join("data", "visit-pool.json");
if (!existsSync(poolPath)) {
  fail("missing data/visit-pool.json");
} else {
  const pool = JSON.parse(readFileSync(poolPath, "utf8"));
  if (!Array.isArray(pool) || pool.length < 100) {
    fail("visit pool is too small to vary the top page");
  }
  for (const drink of pool) {
    const row = drinks.find((item) => item.slug === drink.slug);
    if (!row || row["公開"] !== "1") {
      fail(`visit pool includes a drink that is not public: ${drink.slug}`);
      continue;
    }
    if (!drink.src || !String(drink.src).startsWith("/drinks/") || String(drink.src).includes("fallback-")) {
      fail(`visit pool still is not real: ${drink.slug}`);
    }
    if (Boolean(drink.generic) !== (row["定番"] === "1")) {
      fail(`visit pool generic flag drifted for ${drink.slug}`);
    }
  }
}
if (drinks.length !== 932) {
  fail(`expected 932 drink rows, found ${drinks.length}`);
}
const publicDrinks = drinks.filter((drink) => drink["公開"] === "1");
const hiddenDrinks = drinks.filter((drink) => drink["公開"] === "0");
if (publicDrinks.length !== 898) {
  fail(`expected 898 public drink rows, found ${publicDrinks.length}`);
}
if (hiddenDrinks.length !== 34) {
  fail(`expected 34 hidden drink rows, found ${hiddenDrinks.length}`);
}

function sizeSentences(value) {
  return value
    .split("。")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

function sizeHasPredicate(sentence) {
  return /(です|ます|ません|でした|ました|でしょう|ください)$/.test(sentence);
}

for (const drink of drinks) {
  const size = drink["サイズ"];
  if (size.includes("卓")) {
    fail(`${drink.slug} サイズ uses the jargon 卓`);
  }
  if (size.replaceAll("大さじ一杯", "").replaceAll("小さじ一杯", "").includes("一杯")) {
    fail(`${drink.slug} サイズ uses the jargon 一杯`);
  }
  if (size.includes("中身は")) {
    fail(`${drink.slug} サイズ uses 中身は`);
  }
  if (/PET/.test(size)) {
    fail(`${drink.slug} サイズ uses bare PET`);
  }
  if (/ペット(?!ボトル)/.test(size)) {
    fail(`${drink.slug} サイズ uses ペット without ボトル`);
  }
  for (const bolt of ["注がなくていい量", "注いで分ける量", "一人に一本の量", "飲みきりの量"]) {
    if (size.includes(bolt)) {
      fail(`${drink.slug} サイズ bolts a fragment onto 量: ${bolt}`);
    }
  }
  if (size !== "" && !size.endsWith("。")) {
    fail(`${drink.slug} サイズ does not finish a sentence`);
  }
  let fragmentRun = 0;
  let reportedChain = false;
  for (const sentence of sizeSentences(size)) {
    if (/^\d+(?:\.\d+)?(?:ml|mL|ML|g|kg|L)$/.test(sentence)) {
      fail(`${drink.slug} サイズ is a measure with no sentence: ${sentence}。`);
    }
    if (!sizeHasPredicate(sentence)) {
      fragmentRun += 1;
      fail(`${drink.slug} サイズ has a noun-only sentence: ${sentence}。`);
      if (fragmentRun >= 2 && !reportedChain) {
        fail(`${drink.slug} サイズ is a telegraph chain`);
        reportedChain = true;
      }
    } else {
      fragmentRun = 0;
    }
  }
}
if (drinks.some((drink) => drink["カテゴリ"] === "クラフト／瓶もの")) {
  fail("craft bottle category still uses the slash label");
}
const craftCount = drinks.filter((drink) => drink["カテゴリ"] === "クラフト・瓶もの").length;
if (craftCount !== 227) {
  fail(`expected 227 craft bottle rows, found ${craftCount}`);
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
    const image = still.startsWith("/") ? `https://stylish.sunsup.me${still}` : still;
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
  if (!html.includes("次の飲み会に") || !html.includes("持っていく一本です。")) {
    fail(`${drink.slug} is missing the close line`);
  }
  if (!html.includes("/ 898") || html.includes("/ 932")) {
    fail(`${drink.slug} catalog count is not the public 898`);
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
if (!list.includes("<title>ドリンク一覧｜STYLISH!</title>")) {
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
if (
  !(home.includes("898本") || home.includes("898<!-- -->本")) ||
  home.includes("932本") ||
  home.includes("932<!-- -->本")
) {
  fail("home count is not the public 898");
}
if (!list.includes("898本") || list.includes("932本")) {
  fail("drink list count is not the public 898");
}
if (shell.includes('data-store-primary="true"')) {
  fail("shell has a store CTA");
}

const sitemap = read("sitemap.xml");
const robots = read("robots.txt");
if (!robots.includes("Sitemap: https://stylish.sunsup.me/sitemap.xml")) {
  fail("robots.txt is missing the sitemap");
}
if (!sitemap.includes("<loc>https://stylish.sunsup.me/drink/</loc>")) {
  fail("sitemap is missing the drink list");
}
for (const slug of slugs) {
  if (!sitemap.includes(`<loc>https://stylish.sunsup.me/drink/${slug}/</loc>`)) {
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

// Seasonal studio stills (data/still-seasons.json): every listed drink keeps its white cutout,
// its transparent master and all four season photos, and its page is routed through the season function.
const STILL_SEASONS = ["spring", "summer", "autumn", "winter"];
const seasonManifest = JSON.parse(readFileSync(join("data", "still-seasons.json"), "utf8"));
const seasonSlugs = Object.keys(seasonManifest.drinks ?? {});
if (seasonSlugs.length === 0) {
  fail("data/still-seasons.json lists no drinks");
}
if (JSON.stringify(seasonManifest.seasons) !== JSON.stringify(STILL_SEASONS)) {
  fail("data/still-seasons.json seasons must be spring, summer, autumn, winter");
}
const bySlug = new Map(drinks.map((drink) => [drink.slug, drink]));
let seasonRoutes = { include: [] };
if (existsSync(join("out", "_routes.json"))) {
  seasonRoutes = JSON.parse(readFileSync(join("out", "_routes.json"), "utf8"));
} else {
  fail("missing out/_routes.json");
}
if (!seasonRoutes.include?.includes("/*")) {
  fail("_routes.json must run functions on every page (old-host redirect, /api/*, season stills)");
}
for (const folder of ["/_next/*", "/drinks/*", "/og/*", "/brand/*", "/images/*"]) {
  if (!seasonRoutes.exclude?.includes(folder)) {
    fail(`_routes.json must keep static ${folder} out of functions`);
  }
}
const seasonSlugFile = existsSync(join("lib", "season-slugs.ts")) ? readFileSync(join("lib", "season-slugs.ts"), "utf8") : "";
if (!seasonSlugFile) {
  fail("missing lib/season-slugs.ts");
}
if (!existsSync(join("functions", "_middleware.ts"))) {
  fail("missing functions/_middleware.ts (sunsup-dv4.pages.dev → stylish.sunsup.me)");
}
if ((seasonRoutes.include?.length ?? 0) + (seasonRoutes.exclude?.length ?? 0) > 100) {
  fail("_routes.json has more than 100 rules");
}
for (const slug of seasonSlugs) {
  const drink = bySlug.get(slug);
  if (!drink) {
    fail(`still-seasons lists unknown drink ${slug}`);
    continue;
  }
  const cutout = `/drinks/${slug}.webp`;
  if (drink["静物URL"] !== cutout) {
    fail(`${slug} 静物URL must stay the white cutout ${cutout}`);
  }
  if (!existsSync(join("out", cutout.slice(1)))) {
    fail(`${slug} is missing its cutout out${cutout}`);
  }
  if (!existsSync(join("stills", "masters", `${slug}.png`))) {
    fail(`${slug} is missing its master stills/masters/${slug}.png`);
  }
  for (const season of STILL_SEASONS) {
    const file = join("out", "drinks", "season", `${slug}_${season}.webp`);
    if (!existsSync(file) || readFileSync(file).length < 10000) {
      fail(`${slug} is missing its ${season} still ${file}`);
    }
  }
  if (!seasonSlugFile.includes(`"${slug}"`)) {
    fail(`lib/season-slugs.ts does not list ${slug} for the season function`);
  }
  if (drink["公開"] === "1") {
    const page = read(`drink/${slug}/index.html`);
    const hero = page.match(new RegExp(`<img\\b[^>]*data-season-still="${slug}"[^>]*>`));
    if (!hero) {
      fail(`/drink/${slug}/ hero is not a season still`);
    } else if (!new RegExp(`src="/drinks/season/${slug}_(?:spring|summer|autumn|winter)\\.webp"`).test(hero[0])) {
      fail(`/drink/${slug}/ season still has the wrong src`);
    }
    if (!page.includes(`src="${cutout}"`)) {
      fail(`/drink/${slug}/ lost its white cutout card`);
    }
  }
}
const seasonDir = join("out", "drinks", "season");
if (existsSync(seasonDir)) {
  for (const file of readdirSync(seasonDir)) {
    const match = file.match(/^(.+)_(spring|summer|autumn|winter)\.webp$/);
    if (!match || !seasonSlugs.includes(match[1])) {
      fail(`out/drinks/season/${file} is not listed in data/still-seasons.json`);
    }
  }
}
if (!existsSync(join("functions", "drink", "[[path]].ts"))) {
  fail("missing the season function functions/drink/[[path]].ts");
}

// Every built page, payload, sitemap and robots must point at stylish.sunsup.me, never the old pages.dev host.
const OLD_HOST = "sunsup-dv4.pages.dev";
function walkOut(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (path !== join("out", "_next", "static")) {
        walkOut(path);
      }
    } else if (/\.(html|txt|xml|json|webmanifest)$/.test(entry.name)) {
      if (readFileSync(path, "utf8").includes(OLD_HOST)) {
        fail(`${path} still mentions ${OLD_HOST}`);
      }
    }
  }
}
walkOut("out");
const homeHtml = read("index.html");
for (const [file, path] of [["index.html", "/"], ["about/index.html", "/about/"], ["ba/office/index.html", "/ba/office/"], ["drink/index.html", "/drink/"]]) {
  if (!read(file).includes(`<link rel="canonical" href="https://stylish.sunsup.me${path}"/>`)) {
    fail(`${file} is missing its canonical https://stylish.sunsup.me${path}`);
  }
}
for (const slug of slugs) {
  if (!read(`drink/${slug}/index.html`).includes(`<link rel="canonical" href="https://stylish.sunsup.me/drink/${slug}/"/>`)) {
    fail(`/drink/${slug}/ is missing its canonical`);
  }
}
if (!homeHtml.includes('<meta property="og:url" content="https://stylish.sunsup.me/"/>')) {
  fail("home og:url is not https://stylish.sunsup.me/");
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(message);
  }
  process.exit(1);
}

console.log(`export ok: ${slugs.length} public drink pages`);
