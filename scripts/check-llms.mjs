// Fails the build when out/llms.txt is missing, empty, or links somewhere that
// would not return 200. A link returns 200 when it is an absolute URL in the
// sitemap set. The file must also cover every non-drink sitemap URL, and each
// line must repeat that page's document title and meta description.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { llmsContentType } from "../functions/_middleware.ts";

const ORIGIN = "https://stylish.sunsup.me";
const SUFFIX = "｜STYLISH!";
const ITEM = /^- \[([^\]]*)\]\(([^)]*)\): (.+)$/;

const failures = [];
const fail = (message) => failures.push(message);

function finish() {
  if (failures.length === 0) {
    return;
  }
  for (const message of failures) {
    console.error(`✗ ${message}`);
  }
  process.exit(1);
}

function selfTestContentType() {
  if (llmsContentType("/llms.txt", 200) !== "text/plain; charset=utf-8") {
    fail("llms.txt 200 is not text/plain; charset=utf-8");
  }
  if (llmsContentType("/llms.txt", 404) !== null || llmsContentType("/robots.txt", 200) !== null || llmsContentType("/index.txt", 200) !== null) {
    fail("llms content type leaked onto another response");
  }
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

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);
}

function isAbsolute(url) {
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.host !== "";
  } catch {
    return false;
  }
}

function readOut(path) {
  const file = join("out", path);
  if (!existsSync(file)) {
    return null;
  }
  return readFileSync(file, "utf8");
}

function pageHtml(loc) {
  const path = loc.slice(ORIGIN.length);
  const rel = path === "/" ? "index.html" : `${path.slice(1)}index.html`;
  return readOut(rel);
}

function meta(html) {
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  const descriptionTag = html.match(/<meta\b[^>]*name="description"[^>]*>/);
  const description = decode(descriptionTag?.[0].match(/\bcontent="([^"]*)"/)?.[1] ?? "");
  return { title, description };
}

function titleMatches(llmsTitle, htmlTitle) {
  return htmlTitle === llmsTitle || htmlTitle === `${llmsTitle}${SUFFIX}`;
}

selfTestContentType();

const text = readOut("llms.txt");
if (text == null) {
  fail("out/llms.txt is missing");
  finish();
}
if (!text.trim()) {
  fail("llms.txt is empty");
  finish();
}

const lines = text.split("\n");
const h1 = lines.find((line) => line.startsWith("# "));
if (h1 !== "# STYLISH!") {
  fail(`llms.txt H1 is ${h1 ? JSON.stringify(h1) : "missing"}; expected "# STYLISH!"`);
}
if (!lines.some((line) => line.startsWith("## "))) {
  fail("llms.txt has no H2 section");
}

const homeHtml = pageHtml(`${ORIGIN}/`);
const home = homeHtml ? meta(homeHtml) : null;
const summary = lines.find((line) => line.startsWith("> "));
if (!summary || summary.length < 3) {
  fail("llms.txt is missing a blockquote summary");
} else if (!home || summary.slice(2) !== home.description) {
  fail("llms.txt summary is not the homepage meta description");
}

const scenesXml = readOut("sitemap-scenes.xml");
const categoriesXml = readOut("sitemap-categories.xml");
const drinksXml = readOut("sitemap-drinks.xml");
if (!scenesXml || !categoriesXml || !drinksXml) {
  fail("llms.txt check needs the built sitemaps");
  finish();
}
const pageLocs = new Set([...locs(scenesXml), ...locs(categoriesXml)]);
const sitemap = new Set([...pageLocs, ...locs(drinksXml)]);
const linked = [];

for (const line of lines) {
  if (!line.startsWith("- ") && !line.includes("](")) {
    continue;
  }
  const match = ITEM.exec(line);
  if (!match) {
    fail(`llms.txt link is not "- [title](absolute url): description": ${line}`);
    continue;
  }
  const title = match[1];
  const href = match[2];
  const description = match[3];
  if (!title.trim() || !description.trim()) {
    fail(`llms.txt link is missing a title or description: ${line}`);
  }
  if (!isAbsolute(href)) {
    fail(`llms.txt link is not absolute: ${href || line}`);
    continue;
  }
  if (!sitemap.has(href)) {
    fail(`llms.txt link is not in the sitemap set: ${href}`);
    continue;
  }
  linked.push({ title, href, description });
}

if (text.trim() && linked.length === 0) {
  fail("llms.txt has no links");
}

const seen = new Set();
for (const link of linked) {
  if (seen.has(link.href)) {
    fail(`llms.txt lists ${link.href} more than once`);
  }
  seen.add(link.href);
  if (!pageLocs.has(link.href)) {
    fail(`llms.txt lists a drink page or other URL outside the index pages: ${link.href}`);
    continue;
  }
  const html = pageHtml(link.href);
  if (!html) {
    fail(`llms.txt link has no built page: ${link.href}`);
    continue;
  }
  const page = meta(html);
  if (!titleMatches(link.title, page.title)) {
    fail(`llms.txt title for ${link.href} is not the page title`);
  }
  if (link.description !== page.description) {
    fail(`llms.txt description for ${link.href} is not the page meta description`);
  }
}

for (const loc of pageLocs) {
  if (!seen.has(loc)) {
    fail(`sitemap page missing from llms.txt: ${loc}`);
  }
}

if (existsSync(join("out", "llms-full.txt"))) {
  fail("out/llms-full.txt must not be published");
}

finish();
if (failures.length === 0) {
  console.log(`llms.txt ok: ${linked.length} links, summaries match the built pages`);
}
