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

read("index.html");
read("ba/office/index.html");
read("about/index.html");
const shell = read("drink/shell/index.html");
const office = read("ba/office/index.html");

if (shell.includes("amazon.co.jp") || shell.includes("rakuten.co.jp") || shell.includes("公式サイト")) {
  fail("shell includes a store link");
}
if (shell.includes("KIMINO") || shell.includes("クラノオト")) {
  fail("shell includes a product name");
}
if (!office.includes("/drink/shell/")) {
  fail("office no longer links to the drink shell");
}

const table = parseCsv(readFileSync(join("data", "drinks.csv"), "utf8"));
const header = table[0];
const drinks = table.slice(1).map((row) => Object.fromEntries(header.map((column, index) => [column, (row[index] ?? "").trim()])));
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
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(message);
  }
  process.exit(1);
}

console.log(`export ok: ${slugs.length} drink pages`);
