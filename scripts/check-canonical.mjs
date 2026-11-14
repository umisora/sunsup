// Fails the build when a sitemap URL has no self-canonical page, or when a built
// page's canonical points somewhere else without being intentionally left out of
// the sitemap. Also checks the redirect helper and that retired drink slugs are
// not built, linked, or listed.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ORIGIN = "https://stylish.sunsup.me";
// Built, but not a published URL. /404/ is the not-found page. /drink/shell/ is
// the empty template. Both may omit a canonical or point elsewhere.
const EXCLUDED = new Set(["/drink/shell/", "/404/"]);
const RETIRED = [
  "/drink/sanpellegrino-limonata-pet/",
  "/drink/kirin-namacha-400/",
  "/drink/pokka-kireto-155/",
  "/drink/pokka-kireto-wlemon-500/",
];

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
  ["/drink/sanpellegrino-limonata-pet/index.html", "", "/drink/sanpellegrino-limonata/"],
  ["/drink/sanpellegrino-limonata-pet/", "", "/drink/sanpellegrino-limonata/"],
  ["/drink/sanpellegrino-limonata-pet", "?q=1", "/drink/sanpellegrino-limonata/?q=1"],
  ["/drink//kirin-namacha-400/", "", "/drink/namacha-525/"],
  ["/drink/pokka-kireto-155", "", "/drink/pokka-kireto-lemon/"],
  ["/drink/pokka-kireto-wlemon-500/", "", "/drink/pokka-kireto-wlemon/"],
  ["/ba/nomanai-hito", "", "/ba/okurimono/"],
  ["/ba//nomanai-hito/", "", "/ba/okurimono/"],
  ["/index.txt", "", null],
  ["/robots.txt", "", null],
  ["/ba/kaisha/", "?utm_source=gsc", null],
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

const byRoute = new Map(pages.map((page) => [page.route, page]));
let sitemapLocs = [];
try {
  sitemapLocs = [...locs(readFileSync(join("out", "sitemap-pages.xml"), "utf8")), ...locs(readFileSync(join("out", "sitemap-drinks.xml"), "utf8"))];
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const selfCanonical = new Map();
for (const page of pages) {
  const own = `${ORIGIN}${page.route}`;
  if (EXCLUDED.has(page.route)) {
    continue;
  }
  if (!page.canonical) {
    fail(`${page.route} has no canonical`);
    continue;
  }
  if (page.canonical !== own) {
    fail(`${page.route} canonical is ${page.canonical}`);
    continue;
  }
  selfCanonical.set(own, page.route);
}

for (const loc of sitemapLocs) {
  if (selfCanonical.get(loc) == null) {
    fail(`sitemap URL has no self-canonical page: ${loc}`);
  }
}

for (const [own, route] of selfCanonical) {
  if (!sitemapLocs.includes(own)) {
    fail(`self-canonical page is missing from the sitemap: ${route}`);
  }
}

for (const path of RETIRED) {
  const slug = path.split("/").filter(Boolean).at(-1);
  if (byRoute.has(path) || existsSync(join("out", "drink", slug, "index.html"))) {
    fail(`retired drink is still built: ${path}`);
  }
  if (sitemapLocs.includes(`${ORIGIN}${path}`)) {
    fail(`sitemap lists retired ${path}`);
  }
}

for (const page of pages) {
  const hrefs = [...page.html.matchAll(/\shref="([^"]+)"/g)].map((match) => match[1]);
  for (const href of hrefs) {
    for (const path of RETIRED) {
      if (href.includes(path.slice(0, -1))) {
        fail(`${page.route} links to retired ${path}`);
      }
    }
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

const dated = pages.filter((page) => !EXCLUDED.has(page.route)).length;
console.log(`canonical ok: ${dated} self-canonical pages, ${sitemapLocs.length} sitemap urls, ${RETIRED.length} retired slugs`);
