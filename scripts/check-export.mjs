import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fillExportIssues, selfTestFillHtml } from "./check-fill-html.mjs";
import { isGenericProduct } from "./generic-rule.mjs";
// JSON-LD on drink pages has its own checker; importing runs it first.
import "./check-jsonld.mjs";
import "./check-scenes.mjs";
import "./check-categories.mjs";
import "./check-sitemaps.mjs";
import "./check-html-size.mjs";
import "./check-shop-links.mjs";
import "./check-meta.mjs";

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
if (!home.includes("<title>飲み会のノンアル、おしゃれに選ぶ｜STYLISH!</title>") || home.includes("drinkup") || home.includes("Drinkup")) {
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
  "kagome-grape-100",
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

function textLength(value) {
  return [...value].length;
}

function preferredStem(drink) {
  const custom = (drink.titleName ?? "").trim();
  return custom || drink["品名"];
}

/** Same resolution as lib/drinks.ts resolveTitleStems. Volume is never stripped. */
function resolveTitleStems(rows) {
  const stems = new Map();
  for (const drink of rows) stems.set(drink.slug, preferredStem(drink));
  const counts = () => {
    const tally = new Map();
    for (const stem of stems.values()) tally.set(stem, (tally.get(stem) ?? 0) + 1);
    return tally;
  };
  let tally = counts();
  for (const drink of rows) {
    const stem = stems.get(drink.slug);
    if ((tally.get(stem) ?? 0) <= 1) continue;
    if (drink["品名"] !== stem) stems.set(drink.slug, drink["品名"]);
  }
  tally = counts();
  for (const drink of rows) {
    const stem = stems.get(drink.slug);
    if ((tally.get(stem) ?? 0) <= 1) continue;
    stems.set(drink.slug, `${drink["品名"]}｜${drink["カテゴリ"]}`);
  }
  return stems;
}

let titleStemBySlug = new Map();

function drinkTitle(drink) {
  const stem = titleStemBySlug.get(drink.slug) ?? preferredStem(drink);
  return `${stem}｜STYLISH!`;
}

const DESCRIPTION_FLOOR = 80;
const DESCRIPTION_MAX = 120;
const CONTAINERS = ["ペットボトル", "紙パック", "ガラス瓶", "ビー玉瓶", "ボトル缶", "紙カップ", "カップ", "ボトル", "缶", "瓶"];
const INTENSIFIERS = ["すっぽり", "ぴったり", "ちょうど"];

function sentenceAt(value, index) {
  let rest = value.trim();
  for (let cursor = 0; cursor < index; cursor += 1) {
    const end = rest.indexOf("。");
    if (end === -1) return "";
    rest = rest.slice(end + 1).trim();
  }
  if (!rest) return "";
  const end = rest.indexOf("。");
  if (end === -1) return rest;
  return rest.slice(0, end + 1);
}

function clipAtSentence(value, max) {
  if (textLength(value) <= max) return value;
  const chars = [...value];
  let end = -1;
  const limit = Math.min(chars.length, max);
  for (let index = 0; index < limit; index += 1) {
    if (chars[index] === "。") end = index;
  }
  if (end === -1) return value;
  return chars.slice(0, end + 1).join("");
}

function volumesIn(value) {
  return value.match(/\d+(?:\.\d+)?(?:ml|mL|ML|kg|g|L)/g) ?? [];
}

function hasVolume(description, volume) {
  const escaped = volume.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^0-9])${escaped}`).test(description);
}

function containerTokens(value) {
  const found = [];
  let rest = value;
  for (const word of CONTAINERS) {
    if (!rest.includes(word)) continue;
    found.push(word);
    rest = rest.split(word).join("");
  }
  return found;
}

function foldSizeWords(value) {
  return value.replace(/小ぶりな|小ぶり|小さな|小さい|小さめ|大きな|大きい|大きめ|低め|低い|高め|高い/g, (word) => {
    if (word.startsWith("小")) return "小";
    if (word.startsWith("大")) return "大";
    if (word.startsWith("低")) return "低";
    if (word.startsWith("高")) return "高";
    return word;
  });
}

function normalizeSentence(value) {
  return foldSizeWords(value.replace(/[。、\s]/g, ""));
}

/** Same rules as repeatsDescribedPoint in lib/drinks.ts. */
function repeatsDescribedPoint(sentence, description) {
  const normalized = normalizeSentence(sentence);
  if (!normalized) return true;
  const existing = description
    .split("。")
    .map((part) => normalizeSentence(part))
    .filter((part) => part !== "");
  if (existing.some((part) => part === normalized)) return true;

  const stripped = sentence.replace(/。$/, "").replace(/(?:の文字|の表記)?(?:です|ます)$/, "");
  if (!stripped.includes("、") && [...stripped].length >= 4 && containsPiece(description, stripped)) return true;

  if (onlyKnownSizeOrContainer(sentence, description)) return true;
  return clausesAlreadySaid(sentence, description);
}

function containsPiece(description, piece) {
  if (/^\d+(?:\.\d+)?(?:ml|mL|ML|kg|g|L)$/.test(piece)) return hasVolume(description, piece);
  return description.includes(piece);
}

function onlyKnownSizeOrContainer(sentence, description) {
  const volumes = volumesIn(sentence);
  const containers = containerTokens(sentence);
  const known = volumes.some((volume) => hasVolume(description, volume)) || containers.some((word) => description.includes(word));
  if (!known) return false;
  let rest = sentence;
  for (const token of [...volumes, ...CONTAINERS]) rest = rest.split(token).join("");
  rest = rest.replace(/小ぶりな|小ぶり|小さな|小さい|小さめ|大きな|大きい|大きめ|低め|低い|高め|高い/g, "");
  rest = rest.replace(/です|ます|ません|でした|ました/g, "");
  rest = rest.replace(/[。、\sのをにはがともへやで]/g, "");
  return [...rest].length <= 2;
}

function clausesAlreadySaid(sentence, description) {
  const clauses = sentence
    .split("、")
    .map((clause) => clause.trim())
    .filter((clause) => clause !== "");
  if (clauses.length === 0) return false;
  return clauses.every((clause) => clauseAlreadySaid(clause, description));
}

function clauseAlreadySaid(clause, description) {
  const volumes = volumesIn(clause);
  if (volumes.some((volume) => !hasVolume(description, volume))) return false;
  let rest = clause.replace(/。$/, "");
  for (const token of [...volumes, ...INTENSIFIERS]) rest = rest.split(token).join("");
  rest = rest.replace(/\s/g, "");
  const substance = rest.replace(/(?:です|ます)$/, "").replace(/[のをにはがともへやで]/g, "");
  if ([...substance].length === 0) return volumes.length > 0;
  if ([...substance].length < 4) return false;
  return description.includes(rest);
}

function baseDescription(name, place, size, look) {
  let text = `${name}。${place}`;
  if (textLength(text) < DESCRIPTION_FLOOR) {
    const sizeSentence = sentenceAt(size, 0);
    if (sizeSentence) text += sizeSentence;
  }
  if (textLength(text) < DESCRIPTION_FLOOR) {
    const lookSentence = sentenceAt(look, 0);
    if (lookSentence) text += lookSentence;
  }
  return clipAtSentence(text, DESCRIPTION_MAX);
}

function describeDrink(drink) {
  const base = baseDescription(drink["品名"], drink["場"], drink["サイズ"], drink["見た目"]);
  const added = [];
  let description = base;
  if (textLength(description) < DESCRIPTION_FLOOR) {
    for (const sentence of [sentenceAt(drink["サイズ"], 1), sentenceAt(drink["見た目"], 1)]) {
      if (textLength(description) >= DESCRIPTION_FLOOR) break;
      if (!sentence || sentence.includes("ノンアルです") || repeatsDescribedPoint(sentence, description)) continue;
      if (textLength(description + sentence) > DESCRIPTION_MAX) continue;
      added.push(sentence);
      description += sentence;
    }
  }
  return { description, base, added };
}

function drinkDescription(drink) {
  return describeDrink(drink).description;
}

function selfTestDrinkDescription() {
  const expectRepeat = (sentence, description, expected) => {
    const got = repeatsDescribedPoint(sentence, description);
    if (got !== expected) throw new Error(`repeat expected ${expected} for 「${sentence}」 in 「${description}」`);
  };
  expectRepeat("190gの小さな缶です。", "カゴメ。赤い缶です。190gの小さな缶です。", true);
  expectRepeat("160gの小ぶりな缶です。", "名前。場です。160gの小さな缶です。", true);
  expectRepeat("240mlです。", "名前。場です。240mlの瓶です。", true);
  expectRepeat("500mlです。", "名前。1500mlの瓶です。", false);
  expectRepeat("にっぽん烏龍の文字です。", "ポッカサッポロ にっぽん烏龍。緑のボトルです。", true);
  expectRepeat("330mlで、手にすっぽり収まります。", "名前。場です。330mlの缶で、手に収まります。", true);
  expectRepeat("1Lで、肩から首が細くなっています。", "名前。場です。1Lの瓶です。", false);
  expectRepeat("キャップを開けると、じゃばらの香りが立ちます。", "名前。小さな瓶を置きます。250mlの瓶です。", false);
  expectRepeat("ひとりに一本渡せば足ります。", "名前。場です。340gの缶です。", false);
  expectRepeat("500mlの透明ペットボトルです。", "名前。透明なボトルを出せます。500mlです。", true);
  expectRepeat("1000mlの表記です。", "名前。出せます。1000mlです。", true);
  expectRepeat("200mlで、パインらしい黄色です。", "名前。場です。200mlの紙パックです。黄色い紙パックです。", false);

  const longPlace = `${"あ".repeat(90)}`;
  const long = describeDrink({ 品名: "名", 場: longPlace, サイズ: "一文。二文です。", 見た目: "見。次です。" });
  if (long.description !== `名。${longPlace}` || long.added.length !== 0) {
    throw new Error("a description of 80 or more characters was changed");
  }

  const extended = describeDrink({
    品名: "名前",
    場: `${"あ".repeat(60)}。`,
    サイズ: "瓶です。ひとりに一本渡せば足ります。",
    見た目: "緑です。青い色が目に入ります。",
  });
  if (!extended.description.endsWith("ひとりに一本渡せば足ります。")) throw new Error("size sentence was not appended first");
  if (extended.description.includes("青い色が目に入ります。")) throw new Error("look sentence was appended after the description reached 80");
  if (extended.added.length !== 1) throw new Error(`expected one added sentence, got ${extended.added.length}`);

  const banned = describeDrink({
    品名: "名",
    場: "場です。",
    サイズ: "瓶です。ノンアルです。",
    見た目: "緑です。香りがします。",
  });
  if (banned.description.includes("ノンアルです")) throw new Error("appended 「ノンアルです」");
  if (!banned.description.includes("香りがします。")) throw new Error("a later sentence was skipped with the banned one");

  const duplicate = describeDrink({
    品名: "名",
    場: "場です。",
    サイズ: "240mlの瓶です。240mlです。",
    見た目: "緑の瓶です。キャップを開けると香ります。",
  });
  if (duplicate.added.some((sentence) => sentence.startsWith("240mlです"))) throw new Error("duplicate size sentence was added");
  if (!duplicate.description.includes("キャップを開けると香ります。")) throw new Error("look sentence was not added");

  const tooLong = describeDrink({
    品名: "名",
    場: "場です。",
    サイズ: `一文。${"あ".repeat(130)}`,
    見た目: "二文目はこちらです。短い追加です。",
  });
  if (tooLong.description.includes("あ".repeat(40))) throw new Error("a sentence past 120 characters was added");
  if (!tooLong.description.includes("短い追加です。")) throw new Error("a shorter second sentence was skipped");
  if (textLength(tooLong.description) > 120) throw new Error("description passed 120");
}

selfTestDrinkDescription();

/** React escapes `&` in text and attributes. The catalog copy itself stays unchanged. */
function htmlText(value) {
  return value.replaceAll("&", "&amp;");
}

/** Visible copy: the body, without scripts, so JSON-LD descriptions are not the page text. */
function visibleText(html) {
  const start = html.indexOf("<body");
  const body = start === -1 ? "" : html.slice(start);
  const stripped = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  const text = stripped.replace(/<[^>]+>/g, "");
  return text
    .replace(/&#(\d+);/g, (_, digits) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, digits) => String.fromCodePoint(parseInt(digits, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

const table = parseCsv(readFileSync(join("data", "drinks.csv"), "utf8"));
const header = table[0];
if (!header.includes("定番")) {
  fail("drinks.csv is missing the 定番 column");
}
const drinks = table.slice(1).map((row) => Object.fromEntries(header.map((column, index) => [column, (row[index] ?? "").trim()])));
titleStemBySlug = resolveTitleStems(drinks);
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
  const described = describeDrink(drink);
  const description = htmlText(described.description);
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
  if (!html.includes(`<meta name="twitter:description" content="${description}"/>`)) {
    fail(`${drink.slug} is missing its Twitter description`);
  }
  if (textLength(described.description) > DESCRIPTION_MAX) {
    fail(`${drink.slug} description is ${textLength(described.description)} characters`);
  }
  if (described.description.includes("ノンアルです")) {
    fail(`${drink.slug} description contains 「ノンアルです」`);
  }
  if (textLength(described.base) >= DESCRIPTION_FLOOR && described.description !== described.base) {
    fail(`${drink.slug} description changed a drink that was already 80 characters`);
  }
  if (!described.description.startsWith(described.base)) {
    fail(`${drink.slug} description dropped existing text`);
  }
  const pageText = visibleText(html);
  const ownCopy = `${drink["サイズ"]}\n${drink["見た目"]}`;
  for (const sentence of described.added) {
    if (!pageText.includes(sentence)) {
      fail(`${drink.slug} added description text is not on the page: ${sentence}`);
    }
    if (!ownCopy.includes(sentence)) {
      fail(`${drink.slug} added description text is not from サイズ or 見た目: ${sentence}`);
    }
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
  // Query-string affiliate ids stay out. rel=sponsored on buy links is required
  // and checked in scripts/check-shop-links.mjs, including product URLs with no tag yet.
  if (html.includes("tag=")) {
    fail(`${drink.slug} includes an affiliate marker`);
  }
  if (amazon || rakuten || direct || other || official) {
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

const sitemap = `${read("sitemap-pages.xml")}\n${read("sitemap-drinks.xml")}`;
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
    for (const width of ["480", "800"]) {
      const copy = join("out", "drinks", "season", width, `${slug}_${season}.webp`);
      if (!existsSync(copy)) {
        fail(`${slug} is missing its ${width}w ${season} still ${copy} (run scripts/build-drink-thumbs.py)`);
      }
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
    if (file === "480" || file === "800") {
      continue;
    }
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

// The 「本文へ」 skip link must stay clipped out of view until it has keyboard focus, at any scroll
// position or capture size (a transform alone showed it over the list in full-page captures).
{
  const cssFiles = [];
  const walkCss = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walkCss(full);
      else if (entry.name.endsWith(".css")) cssFiles.push(full);
    }
  };
  walkCss("out/_next/static");
  const css = cssFiles.map((file) => readFileSync(file, "utf8")).join("\n");
  const hidden = css.match(/\.(SkipLink_skip__[\w-]+):not\(:focus-visible\)\{([^}]*)\}/);
  if (!hidden || !/(^|;)clip-path:inset\(50%\)/.test(hidden[2]) || !/width:1px/.test(hidden[2]) || !/height:1px/.test(hidden[2])) {
    fail("the 本文へ skip link is not clipped out of view until it has keyboard focus");
  } else if (!homeHtml.includes(`class="${hidden[1]}" href="#main"`)) {
    fail("the 本文へ skip link on the home page does not use the clipped style");
  }
}


// Scene, office and category pages ship ItemList + BreadcrumbList; top pages ship WebSite or BreadcrumbList.
{
  const need = [
    ["ba/bonenkai/index.html", ["ItemList", "BreadcrumbList"]],
    ["category/citrus/index.html", ["ItemList", "BreadcrumbList"]],
    ["index.html", ["WebSite"]],
    ["about/index.html", ["BreadcrumbList"]],
    ["drink/index.html", ["BreadcrumbList"]],
    ["ba/office/index.html", ["ItemList", "BreadcrumbList"]],
    ["drink/kimino-yuzu/index.html", ["Product", "BreadcrumbList"]],
  ];
  for (const [file, types] of need) {
    const html = read(file);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    const joined = blocks.join("\n");
    for (const type of types) {
      if (!joined.includes(`"@type":"${type}"`) && !joined.includes(`"@type": "${type}"`)) {
        fail(`${file} is missing JSON-LD ${type}`);
      }
    }
  }
}

// Site-wide wording rule: no exclusive words for people who pick soft drinks (say ソフトドリンクが好きな人,
// アルコール以外も楽しみたい人). Any built page with 飲まない人, 飲めない人 or 下戸 fails the build. The renamed
// gift page is /ba/okurimono/; nothing built may still link or point to /ba/nomanai-hito/.
{
  const BANNED = /飲まない人|飲めない人|下戸/g;
  const pages = [];
  const walkHtml = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walkHtml(full);
      else if (entry.name.endsWith(".html") || entry.name.endsWith(".txt") || entry.name.endsWith(".xml")) pages.push(full);
    }
  };
  walkHtml("out");
  let found = 0;
  for (const file of pages) {
    const text = readFileSync(file, "utf8");
    const words = [...new Set(text.match(BANNED) ?? [])];
    if (words.length > 0 && found < 20) {
      fail(`${file} says ${words.join("、")}; use positive wording (ソフトドリンクが好きな人, アルコール以外も楽しみたい人)`);
    }
    found += words.length > 0 ? 1 : 0;
    if (text.includes("/ba/nomanai-hito") && found < 20) {
      fail(`${file} still points to /ba/nomanai-hito/; the page is /ba/okurimono/`);
    }
  }
  if (found > 20) {
    fail(`…and ${found - 20} more page(s) with exclusive wording`);
  }
  if (existsSync("out/ba/nomanai-hito")) {
    fail("out/ba/nomanai-hito/ is still built; the old path should only 301 to /ba/okurimono/");
  }
  const gift = read("ba/okurimono/index.html");
  if (!gift.includes('<link rel="canonical" href="https://stylish.sunsup.me/ba/okurimono/"') || !gift.includes("ソフトドリンク好きに贈る一本")) {
    fail("/ba/okurimono/ has no canonical to itself or no 「ソフトドリンク好きに贈る一本」 title");
  }
  if (!sitemap.includes("<loc>https://stylish.sunsup.me/ba/okurimono/</loc>")) {
    fail("sitemap does not list /ba/okurimono/");
  }
}

// Every drink still shipped as /drinks/<slug>.webp has a 320w thumb for card srcsets.
{
  const missing = [];
  for (const slug of slugs) {
    const still = join("out", "drinks", `${slug}.webp`);
    const thumb = join("out", "drinks", "320", `${slug}.webp`);
    if (existsSync(still) && !existsSync(thumb)) {
      missing.push(slug);
    }
  }
  for (const slug of missing.slice(0, 20)) {
    fail(`drink thumb missing: /drinks/320/${slug}.webp (run scripts/build-drink-thumbs.py)`);
  }
  if (missing.length > 20) {
    fail(`…and ${missing.length - 20} more drink thumbs are missing`);
  }
}

selfTestFillHtml();
for (const message of fillExportIssues("out")) {
  fail(message);
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(message);
  }
  process.exit(1);
}

console.log(`export ok: ${slugs.length} public drink pages`);
