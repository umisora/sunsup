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

const table = parseCsv(readFileSync(join("data", "drinks.csv"), "utf8"));
const header = table[0];
const drinks = table.slice(1).map((row) => Object.fromEntries(header.map((column, index) => [column, (row[index] ?? "").trim()])));
const craftLabels = new Set(drinks.map((drink) => drink["カテゴリ"]).filter((label) => categoryKey(label) === "クラフト・瓶"));
if (!craftLabels.has("クラフト・瓶もの") || !craftLabels.has("クラフト／瓶もの")) {
  fail("craft bottle category is missing one of its two labels");
}
const entryKeys = OFFICE_ENTRIES.map((slug) => {
  const drink = drinks.find((row) => row.slug === slug);
  return drink ? categoryKey(drink["カテゴリ"]) : "";
});
if (entryKeys.some((key) => key === "") || new Set(entryKeys).size !== OFFICE_ENTRIES.length) {
  fail("office entries are not one drink per category");
}

const slugs = drinks.map((drink) => drink.slug);
const pages = readdirSync(join("out", "drink"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "shell")
  .map((entry) => entry.name)
  .sort();

if (pages.length !== slugs.length) {
  fail(`expected ${slugs.length} drink pages, found ${pages.length}`);
}

for (const slug of slugs) {
  if (!pages.includes(slug)) {
    fail(`missing out/drink/${slug}/index.html`);
  }
}

for (const drink of drinks) {
  const html = read(`drink/${drink.slug}/index.html`);
  if (!html) {
    continue;
  }
  if (!html.includes(drink["品名"])) {
    fail(`${drink.slug} is missing its name`);
  }
  if (!html.includes(`<title>${drink["品名"]}｜sunsup</title>`)) {
    fail(`${drink.slug} is missing its title`);
  }
  if (!html.includes(`<meta name="description" content="${drink["場"]}"/>`)) {
    fail(`${drink.slug} is missing its description`);
  }
  if (!html.includes(`<meta property="og:title" content="${drink["品名"]}｜sunsup"/>`)) {
    fail(`${drink.slug} is missing its Open Graph title`);
  }
  if (!html.includes(`<meta property="og:description" content="${drink["場"]}"/>`)) {
    fail(`${drink.slug} is missing its Open Graph description`);
  }
  if (html.includes("drinkup") || html.includes("Drinkup")) {
    fail(`${drink.slug} renames the site`);
  }
  const still = drink["静物URL"];
  if (still.startsWith("/") || still.startsWith("http://") || still.startsWith("https://")) {
    const image = still.startsWith("/") ? `https://sunsup-dv4.pages.dev${still}` : still;
    if (!html.includes(`<meta property="og:image" content="${image}"/>`)) {
      fail(`${drink.slug} is missing its Open Graph image`);
    }
  } else if (html.includes('property="og:image"')) {
    fail(`${drink.slug} has an Open Graph image without a still`);
  }
  if (!html.includes("次の飲み会に、") || !html.includes("これを置く。")) {
    fail(`${drink.slug} is missing the close line`);
  }
  const stores = [
    ["公式URL", "公式サイト"],
    ["AmazonURL", "amazon.co.jp"],
    ["楽天URL", "rakuten.co.jp"],
  ];
  for (const [column, marker] of stores) {
    const url = drink[column];
    if (url) {
      if (!html.includes(url) && !html.includes(url.replaceAll("&", "&amp;"))) {
        fail(`${drink.slug} is missing ${column}`);
      }
    } else if (html.includes(marker)) {
      fail(`${drink.slug} renders an empty ${column}`);
    }
  }
  if (html.includes("tag=") || html.includes("rel=\"sponsored\"")) {
    fail(`${drink.slug} includes an affiliate marker`);
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

if (failures.length > 0) {
  for (const message of failures) {
    console.error(message);
  }
  process.exit(1);
}

console.log(`export ok: ${slugs.length} drink pages`);
