// The 無糖 tag page lists data/tags/mutou.csv and says that count in the description.
// A missing or unpublished slug is not substituted. The page count must still equal the file.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PATH = "/tag/mutou/";
const ORIGIN = "https://stylish.sunsup.me";
const URL = `${ORIGIN}${PATH}`;
const TITLE = "無糖のドリンク｜STYLISH!";
const H1 = "無糖のドリンク";
const LEAD = "飲み会の数日前に、甘くない一本を見た目で選ぶ棚です。";
const DESCRIPTION =
  "甘いサイダーの隣に、無糖を置く。お茶、炭酸水、ブラックコーヒーの{n}本です。テーブルに似合う一本を見た目で選んで、Amazonや楽天のページからそのまま頼めます。";
const SHELF_IDS = new Set(["bottle", "big", "can", "pet", "carton", "other"]);

const failures = [];
const fail = (message) => failures.push(message);

function textLength(value) {
  return [...value].length;
}

function descriptionFor(count) {
  return DESCRIPTION.replaceAll("{n}", String(count));
}

function nonalCount(title, h1, description) {
  return [...`${title}\n${h1}\n${description}`.matchAll(/ノンアル/g)].length;
}

function decode(value) {
  return value
    .replace(/&#(\d+);/g, (_, digits) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, digits) => String.fromCodePoint(parseInt(digits, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
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

function strip(text) {
  return text.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, "").replace(/\s+/g, "");
}

function metaContent(html, key) {
  const tags = html.match(/<meta\b[^>]*>/g) ?? [];
  for (const tag of tags) {
    const name = tag.match(/\b(?:name|property)="([^"]*)"/)?.[1];
    if (name !== key) {
      continue;
    }
    return decode(tag.match(/\bcontent="([^"]*)"/)?.[1] ?? "");
  }
  return "";
}

function shelfSlugs(html) {
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const slugs = [];
  for (const part of visible.split(/<section\b/).slice(1)) {
    const id = part.match(/^[^>]*\bid="([^"]+)"/)?.[1];
    if (!id || !SHELF_IDS.has(id)) {
      continue;
    }
    for (const match of part.matchAll(/href="\/drink\/([a-z0-9-]+)\/"/g)) {
      slugs.push(match[1]);
    }
  }
  return slugs;
}

function selfTest() {
  const sample = descriptionFor(84);
  const length = textLength(sample);
  if (length !== 81 || length < 80 || length > 120 || !sample.includes("84本") || sample.includes("{n}")) {
    throw new Error(`self-test: approved description drifted (${length})`);
  }
  if (nonalCount(TITLE, H1, sample) !== 0) {
    throw new Error("self-test: approved copy contains ノンアル");
  }
  if (nonalCount("ノンアル", "ノンアルコール", "") <= 1) {
    throw new Error("self-test: two ノンアル were allowed");
  }
  if (textLength("短い。") >= 80 || textLength(`${"あ".repeat(121)}`) <= 120) {
    throw new Error("self-test: description length bounds were not exercised");
  }
}

function readTagSlugs() {
  const rows = parseCsv(readFileSync(join("data", "tags", "mutou.csv"), "utf8"));
  const header = (rows[0] ?? []).map((cell) => cell.trim());
  if (header.length !== 1 || header[0] !== "slug") {
    fail("data/tags/mutou.csv header must be slug");
    return [];
  }
  return rows.slice(1).map((row) => (row[0] ?? "").trim()).filter(Boolean);
}

function readPublication() {
  const rows = parseCsv(readFileSync(join("data", "drinks.csv"), "utf8"));
  const header = (rows[0] ?? []).map((cell) => cell.trim());
  const slugAt = header.indexOf("slug");
  const publishedAt = header.indexOf("公開");
  const nameAt = header.indexOf("品名");
  const publication = new Map();
  const names = new Map();
  for (const row of rows.slice(1)) {
    const slug = (row[slugAt] ?? "").trim();
    if (!slug) {
      continue;
    }
    publication.set(slug, (row[publishedAt] ?? "").trim());
    names.set(slug, (row[nameAt] ?? "").trim());
  }
  return { publication, names };
}

selfTest();

const pageFile = join("out", "tag", "mutou", "index.html");
if (!existsSync(pageFile)) {
  console.error("tag check needs out/tag/mutou/ from npm run build");
  process.exit(1);
}

const slugs = readTagSlugs();
const { publication, names } = readPublication();
const skipped = [];
for (const slug of slugs) {
  if (!publication.has(slug)) {
    skipped.push(`${slug} (missing)`);
  } else if (publication.get(slug) !== "1") {
    skipped.push(`${slug} (unpublished)`);
  }
}
if (skipped.length > 0) {
  for (const item of skipped) {
    console.error(`skipped ${item}`);
  }
  fail(`data/tags/mutou.csv has ${skipped.length} slug(s) that are missing or unpublished`);
}
if (new Set(slugs).size !== slugs.length) {
  fail("data/tags/mutou.csv lists a slug twice");
}

const html = readFileSync(pageFile, "utf8");
const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
const description = metaContent(html, "description");
const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g) ?? [];
const h1Text = h1.length === 1 ? strip(h1[0]) : "";
const listed = shelfSlugs(html);
const count = listed.length;

if (title !== TITLE) {
  fail(`title is ${title || "missing"}`);
}
if (h1Text !== H1) {
  fail(`h1 is ${h1Text || "missing"} (${h1.length} h1)`);
}
if (!visible.includes(LEAD)) {
  fail("lead is not the approved sentence");
}
const expectedDescription = descriptionFor(count);
if (description !== expectedDescription) {
  fail("description is not the approved sentence with the listed count");
}
if (!description.includes(`${count}本`)) {
  fail(`description does not contain ${count}`);
}
const length = textLength(description);
if (length < 80 || length > 120) {
  fail(`description length ${length} is outside 80-120`);
}
const nonal = nonalCount(title, h1Text, description);
if (nonal > 1) {
  fail(`ノンアル appears ${nonal} times across title, h1 and description`);
}
if (count !== slugs.length || listed.join("\n") === "" || new Set(listed).size !== listed.length) {
  fail(`page lists ${count} drinks, data/tags/mutou.csv lists ${slugs.length}`);
}
const dataSet = new Set(slugs);
const pageSet = new Set(listed);
for (const slug of slugs) {
  if (!pageSet.has(slug)) {
    fail(`data lists ${slug} but the page does not`);
  }
}
for (const slug of listed) {
  if (!dataSet.has(slug)) {
    fail(`page lists ${slug}, which is not in the data list`);
  }
}

if (!html.includes(`<link rel="canonical" href="${URL}"/>`)) {
  fail("canonical is not the tag page");
}
const sitemap = existsSync(join("out", "sitemap-pages.xml")) ? readFileSync(join("out", "sitemap-pages.xml"), "utf8") : "";
if (!sitemap.includes(`<loc>${URL}</loc>`)) {
  fail("sitemap-pages.xml is missing the tag page");
}
for (const key of ["og:title", "og:description", "twitter:title", "twitter:description"]) {
  const content = metaContent(html, key);
  const expected = key.endsWith("title") ? TITLE : expectedDescription;
  if (content !== expected) {
    fail(`${key} is ${content || "missing"}`);
  }
}
const footer = [...visible.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].filter((match) => match[1] === PATH);
if (footer.length !== 1 || strip(footer[0][2]) !== H1) {
  fail("footer is missing the 無糖のドリンク link");
}

const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
const list = blocks.find((item) => item["@type"] === "ItemList");
const entries = list?.itemListElement;
if (!list || list.numberOfItems !== count || !Array.isArray(entries) || entries.length !== count) {
  fail("ItemList count does not match the page");
} else {
  entries.forEach((entry, index) => {
    const slug = typeof entry?.url === "string" ? entry.url.replace(`${ORIGIN}/drink/`, "").replace(/\/$/, "") : "";
    if (entry?.["@type"] !== "ListItem" || entry.position !== index + 1 || slug !== listed[index] || entry.name !== names.get(slug)) {
      fail(`ItemList position ${index + 1} does not match ${listed[index] ?? "the page"}`);
    }
  });
}

if (failures.length > 0) {
  for (const message of failures.slice(0, 40)) {
    console.error(message);
  }
  if (failures.length > 40) {
    console.error(`…and ${failures.length - 40} more tag-page failures`);
  }
  process.exit(1);
}

console.log(`tag ok: ${PATH} lists ${count} drinks, description ${length} characters, ノンアル ${nonal}`);
