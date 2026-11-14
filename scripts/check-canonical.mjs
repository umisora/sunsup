// Fails the build when a sitemap URL has no page whose canonical is that URL,
// or when a built page is still in the sitemap but its canonical is not its own URL.
// Query strings are not redirected: the built canonical is already the clean URL.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ORIGIN = "https://stylish.sunsup.me";

const failures = [];
const fail = (message) => failures.push(message);

function finish() {
  if (failures.length === 0) {
    return;
  }
  for (const message of failures.slice(0, 40)) {
    console.error(`✗ ${message}`);
  }
  if (failures.length > 40) {
    console.error(`…and ${failures.length - 40} more`);
  }
  process.exit(1);
}

function selfTestRedirects() {
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--import", "./scripts/register-ts.mjs", "--input-type=module", "--eval", REDIRECT_TEST],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    const detail = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    fail(detail || "redirect self-test failed");
  }
}

const REDIRECT_TEST = `
import { isRscPayload, redirectPath } from "./functions/_middleware.ts";
const cases = [
  ["/about/", "", null],
  ["/about//", "", "/about/"],
  ["/about///", "?x=1", "/about/?x=1"],
  ["//about/", "", "/about/"],
  ["/about/index.html", "", "/about/"],
  ["/index.html", "", "/"],
  ["/about//", "?utm_source=gsc", "/about/?utm_source=gsc"],
  ["/ba/kaisha/", "?utm_source=gsc", null],
  ["/ba/kaisha/", "?story=autumn-afternoon", null],
  ["/drink/sanpellegrino-limonata-pet/", "", null],
  ["/drink/kirin-namacha-400/", "", null],
  ["/drink/pokka-kireto-155/", "", null],
  ["/drink/pokka-kireto-wlemon-500/", "", null],
  ["/ba/nomanai-hito", "", "/ba/okurimono/"],
  ["/ba//nomanai-hito/", "", "/ba/okurimono/"],
  ["/index.txt", "", null],
  ["/robots.txt", "", null],
];
for (const [pathname, search, expected] of cases) {
  const got = redirectPath(pathname, search);
  if (got !== expected) {
    console.error("redirect " + pathname + search + " -> " + got + ", expected " + expected);
    process.exit(1);
  }
}
if (!isRscPayload("/index.txt") || !isRscPayload("/drink/kimino-yuzu/index.txt") || isRscPayload("/robots.txt")) {
  console.error("RSC payload detection mismatched");
  process.exit(1);
}
`;

selfTestRedirects();
if (failures.length > 0) {
  finish();
}

function routeOf(rel) {
  if (rel === "404.html" || rel.startsWith("_next/")) return null;
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return null;
}

function walkHtml(dir, prefix = "") {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "_next") continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...walkHtml(join(dir, entry.name), rel));
    else if (entry.name.endsWith(".html")) found.push(rel);
  }
  return found;
}

function canonicalOf(html) {
  return html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);
}

function pageHref(href) {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const hash = href.indexOf("#");
  const query = href.indexOf("?");
  const cut = [hash, query].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? href.length;
  const path = href.slice(0, cut);
  const leaf = path.split("/").pop() ?? "";
  if (leaf.includes(".") && leaf !== "index.html") return null;
  return path;
}

if (!existsSync(join("out", "index.html"))) {
  console.error("canonical check needs out/ from npm run build");
  process.exit(1);
}

const pages = [];
for (const rel of walkHtml("out")) {
  const route = routeOf(rel);
  if (!route) continue;
  const html = readFileSync(join("out", rel), "utf8");
  pages.push({ route, html, canonical: canonicalOf(html) });
}

let sitemapLocs = [];
try {
  sitemapLocs = [...locs(readFileSync(join("out", "sitemap-pages.xml"), "utf8")), ...locs(readFileSync(join("out", "sitemap-drinks.xml"), "utf8"))];
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const sitemapSet = new Set(sitemapLocs);
const selfCanonical = new Map();
for (const page of pages) {
  const own = `${ORIGIN}${page.route}`;
  if (page.canonical === own) {
    selfCanonical.set(own, page.route);
  }
  if (!sitemapSet.has(own)) {
    continue;
  }
  if (page.canonical !== own) {
    fail(`${page.route} is in the sitemap but its canonical is ${page.canonical || "missing"}`);
  }
}

for (const loc of sitemapLocs) {
  if (!selfCanonical.has(loc)) {
    fail(`sitemap URL has no self-canonical page: ${loc}`);
  }
  if (loc.includes("?")) {
    fail(`sitemap URL has a query string: ${loc}`);
  }
}

for (const page of pages) {
  if (page.canonical.includes("?")) {
    fail(`${page.route} canonical keeps a query string: ${page.canonical}`);
  }
  const hrefs = [...page.html.matchAll(/\shref="([^"]+)"/g)].map((match) => match[1]);
  for (const href of hrefs) {
    const path = pageHref(href);
    if (!path) continue;
    if (path.includes("//") || path.endsWith("/index.html") || path === "/index.html") {
      fail(`${page.route} links to non-canonical ${href}`);
    } else if (path !== "/" && !path.endsWith("/")) {
      fail(`${page.route} links without a trailing slash: ${href}`);
    }
  }
}

const robots = readFileSync(join("out", "robots.txt"), "utf8");
if (!robots.includes("Disallow: /*index.txt$")) {
  fail("robots.txt does not disallow RSC index.txt payloads");
}

finish();

console.log(`canonical ok: ${selfCanonical.size} self-canonical pages, ${sitemapLocs.length} sitemap urls`);
