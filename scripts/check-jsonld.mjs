// Checks the schema.org JSON-LD on every exported drink page (run after `npm run build`).
// One Product and one BreadcrumbList, built only from catalog facts: no price, offer, rating, review or brand.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const failures = [];
const fail = (message) => failures.push(message);

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

const [header, ...rows] = parseCsv(readFileSync(join("data", "drinks.csv"), "utf8"));
const drinks = rows.map((row) => Object.fromEntries(header.map((key, index) => [key, row[index] ?? ""])));
const publicDrinks = drinks.filter((drink) => drink["公開"] === "1");

const PRODUCT_KEYS = new Set(["@context", "@type", "@id", "name", "description", "url", "category", "image", "size"]);
const INVENTED = ["offers", "price", "priceCurrency", "aggregateRating", "review", "brand"];
let sized = 0;

for (const drink of publicDrinks) {
  const html = readFileSync(join("out", "drink", drink.slug, "index.html"), "utf8");
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  let items;
  try {
    items = blocks.map((text) => JSON.parse(text));
  } catch {
    fail(`/drink/${drink.slug}/ JSON-LD does not parse`);
    continue;
  }
  const product = items.find((item) => item["@type"] === "Product");
  const crumbs = items.find((item) => item["@type"] === "BreadcrumbList");
  if (items.length !== 2 || !product || !crumbs) {
    fail(`/drink/${drink.slug}/ needs exactly one Product and one BreadcrumbList`);
    continue;
  }
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";
  for (const item of items) {
    if (item["@context"] !== "https://schema.org") {
      fail(`/drink/${drink.slug}/ ${item["@type"]} has the wrong @context`);
    }
  }
  for (const key of Object.keys(product)) {
    if (!PRODUCT_KEYS.has(key)) {
      fail(`/drink/${drink.slug}/ Product has unexpected ${key}`);
    }
  }
  const text = JSON.stringify(items);
  for (const key of INVENTED) {
    if (text.includes(`"${key}"`)) {
      fail(`/drink/${drink.slug}/ JSON-LD carries ${key}, which the catalog does not hold`);
    }
  }
  if (product.name !== drink["品名"] || product.url !== canonical || product.category !== drink["カテゴリ"]) {
    fail(`/drink/${drink.slug}/ Product name, url or category does not match the page`);
  }
  const still = drink["静物URL"];
  if (still.startsWith("/drinks/") && product.image !== new URL(still, canonical).href) {
    fail(`/drink/${drink.slug}/ Product image is not the still`);
  }
  if (product.size !== undefined) {
    sized += 1;
    if (!/^\d+(?:\.\d+)?(?:ml|L|g)$/.test(product.size)) {
      fail(`/drink/${drink.slug}/ Product size ${product.size} is not a volume`);
    }
  }
  const list = crumbs.itemListElement ?? [];
  const chain = list.every((entry, index) => entry["@type"] === "ListItem" && entry.position === index + 1 && entry.name && entry.item);
  if (list.length < 3 || !chain) {
    fail(`/drink/${drink.slug}/ BreadcrumbList is not a numbered ListItem chain`);
  } else if (list.at(-1).item !== canonical) {
    fail(`/drink/${drink.slug}/ BreadcrumbList does not end at the page`);
  }
}

if (failures.length > 0) {
  for (const message of failures.slice(0, 50)) {
    console.error(`✗ ${message}`);
  }
  console.error(`${failures.length} JSON-LD problems`);
  process.exit(1);
}
console.log(`json-ld ok: ${publicDrinks.length} drink pages, ${sized} with a size`);
