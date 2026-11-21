// Fails the build when a published page has no inbound <a href> from another page,
// when a tag or category page is linked only from the header or footer,
// or when a sitemap URL is not that page's canonical.
// Links inside <script> do not count. /drink/shell/ and /404/ are not published.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ORIGIN = "https://stylish.sunsup.me";
const KINDS = ["tag", "category", "scene", "drink", "top"];

/**
 * @param {string} href
 * @returns {string | null}
 */
export function normalizeHref(href) {
  if (href.startsWith(ORIGIN)) {
    href = href.slice(ORIGIN.length) || "/";
  }
  if (!href.startsWith("/") || href.startsWith("//")) {
    return null;
  }
  const cut = href.search(/[?#]/);
  if (cut >= 0) {
    href = href.slice(0, cut);
  }
  if (href !== "/" && !href.endsWith("/")) {
    const leaf = href.slice(href.lastIndexOf("/") + 1);
    if (leaf.includes(".")) {
      return null;
    }
    href = `${href}/`;
  }
  if (
    href.startsWith("/_next/") ||
    href.startsWith("/fonts/") ||
    href.startsWith("/brand/") ||
    href.startsWith("/drinks/") ||
    href.startsWith("/images/") ||
    href.startsWith("/og/")
  ) {
    return null;
  }
  return href;
}

/**
 * @param {string} html
 * @returns {string[]}
 */
export function anchorHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)].map((match) => normalizeHref(match[1] ?? "")).filter((href) => href != null);
}

/** Drop scripts so JSON and the RSC payload are not treated as links. */
export function visibleHtml(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

/** Drop the site header and footer as well, so only in-content links remain. */
export function contentHtml(html) {
  return visibleHtml(html)
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, "");
}

/**
 * @param {string} route
 * @returns {"tag" | "category" | "scene" | "drink" | "top" | "excluded"}
 */
export function pageKind(route) {
  if (route === "/404/" || route === "/drink/shell/") {
    return "excluded";
  }
  if (route.startsWith("/tag/")) {
    return "tag";
  }
  if (route.startsWith("/category/")) {
    return "category";
  }
  if (route.startsWith("/ba/")) {
    return "scene";
  }
  if (/^\/drink\/[^/]+\/$/.test(route)) {
    return "drink";
  }
  return "top";
}

/**
 * @param {string} html
 */
export function isNoindex(html) {
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metas) {
    const name = tag.match(/\bname="([^"]*)"/i)?.[1]?.toLowerCase();
    if (name !== "robots" && name !== "googlebot") {
      continue;
    }
    const content = tag.match(/\bcontent="([^"]*)"/i)?.[1] ?? "";
    if (/noindex/i.test(content)) {
      return true;
    }
  }
  return false;
}

/**
 * @param {{ route: string, html: string, canonical: string, noindex: boolean }[]} pages
 * @param {string[]} sitemapLocs
 */
export function linkIssues(pages, sitemapLocs) {
  /** @type {Map<string, Set<string>>} */
  const inbound = new Map(pages.map((page) => [page.route, new Set()]));
  /** @type {Map<string, Set<string>>} */
  const contentInbound = new Map(pages.map((page) => [page.route, new Set()]));
  for (const page of pages) {
    for (const href of anchorHrefs(visibleHtml(page.html))) {
      if (href !== page.route && inbound.has(href)) {
        inbound.get(href)?.add(page.route);
      }
    }
    for (const href of anchorHrefs(contentHtml(page.html))) {
      if (href !== page.route && contentInbound.has(href)) {
        contentInbound.get(href)?.add(page.route);
      }
    }
  }

  /** @type {Record<string, number>} */
  const zeros = { tag: 0, category: 0, scene: 0, drink: 0, top: 0 };
  /** @type {Record<string, number>} */
  const totals = { tag: 0, category: 0, scene: 0, drink: 0, top: 0 };
  /** @type {Record<string, number>} */
  const contentZeros = { tag: 0, category: 0 };
  /** @type {string[]} */
  const issues = [];

  for (const page of pages) {
    const kind = pageKind(page.route);
    if (kind === "excluded") {
      continue;
    }
    totals[kind] += 1;
    if (page.noindex) {
      continue;
    }
    if ((inbound.get(page.route)?.size ?? 0) === 0) {
      zeros[kind] += 1;
      issues.push(`${page.route} has no inbound internal link`);
    }
    if (kind === "tag" || kind === "category") {
      if ((contentInbound.get(page.route)?.size ?? 0) === 0) {
        contentZeros[kind] += 1;
        issues.push(`${page.route} has no in-content internal link`);
      }
    }
  }

  /** @type {Map<string, { route: string, noindex: boolean }>} */
  const selfCanonical = new Map();
  for (const page of pages) {
    if (page.canonical) {
      selfCanonical.set(page.canonical, page);
    }
  }
  for (const loc of sitemapLocs) {
    if (!loc.startsWith(`${ORIGIN}/`) || !loc.endsWith("/") || loc.includes("?") || loc.startsWith("http://")) {
      issues.push(`sitemap URL is not a trailing-slash ${ORIGIN} URL: ${loc}`);
    }
    const page = selfCanonical.get(loc);
    if (!page || page.canonical !== loc) {
      issues.push(`sitemap URL is not self-canonical: ${loc}`);
      continue;
    }
    if (page.noindex) {
      issues.push(`sitemap URL is noindex: ${loc}`);
    }
  }

  return { issues, zeros, totals, contentZeros, inbound, contentInbound };
}

function canonicalOf(html) {
  return html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";
}

function page(route, body, canonical) {
  const own = canonical ?? `${ORIGIN}${route}`;
  return {
    route,
    html: `<link rel="canonical" href="${own}"/>${body}`,
    canonical: own,
    noindex: false,
  };
}

/** The checker must reject an orphan, a footer-only tag, and a sitemap URL whose canonical is elsewhere. */
export function selfTestInternalLinks() {
  const linked = linkIssues(
    [
      page("/", `<header><a href="/about/"></a></header><main><a href="/category/citrus/"></a></main>`),
      page("/about/", `<main><a href="/"></a></main>`),
      page("/category/citrus/", `<main><a href="/"></a><a href="/drink/a/"></a><a href="/drink/b/"></a></main>`),
      page("/drink/a/", `<main><a href="/category/citrus/"></a></main>`),
      page("/tag/mutou/", `<main><a href="/"></a></main>`),
      page("/drink/b/", `<main><a href="/tag/mutou/">無糖のドリンク</a><a href="/"></a></main>`),
    ],
    [`${ORIGIN}/`, `${ORIGIN}/about/`, `${ORIGIN}/category/citrus/`, `${ORIGIN}/drink/a/`, `${ORIGIN}/drink/b/`, `${ORIGIN}/tag/mutou/`],
  );
  if (linked.issues.length !== 0) {
    throw new Error(`self-test: a linked graph was rejected: ${linked.issues.join("; ")}`);
  }
  if (linked.zeros.tag !== 0 || linked.contentZeros.tag !== 0 || linked.contentZeros.category !== 0) {
    throw new Error("self-test: zero counts were not zero");
  }

  const footerOnly = linkIssues(
    [
      page("/", `<footer><a href="/tag/mutou/"></a></footer><main><a href="/drink/a/"></a></main>`),
      page("/tag/mutou/", `<main><a href="/"></a></main>`),
      page("/drink/a/", `<footer><a href="/tag/mutou/"></a></footer><main><a href="/"></a></main>`),
    ],
    [`${ORIGIN}/tag/mutou/`],
  );
  if (!footerOnly.issues.some((issue) => issue.includes("/tag/mutou/") && issue.includes("in-content"))) {
    throw new Error(`self-test: a footer-only tag was accepted: ${footerOnly.issues.join("; ")}`);
  }
  if (footerOnly.issues.some((issue) => issue.includes("no inbound internal link"))) {
    throw new Error(`self-test: a footer link was ignored: ${footerOnly.issues.join("; ")}`);
  }

  const orphan = linkIssues(
    [page("/drink/a/", `<main><a href="/"></a></main>`), page("/", `<main><a href="/about/"></a></main>`), page("/about/", `<main><a href="/"></a></main>`)],
    [],
  );
  if (!orphan.issues.some((issue) => issue.startsWith("/drink/a/ has no inbound"))) {
    throw new Error(`self-test: an orphan drink was accepted: ${orphan.issues.join("; ")}`);
  }

  const scriptOnly = linkIssues(
    [
      page("/", `<main><a href="/drink/a/"></a></main><script>{"href":"/tag/mutou/"}</script>`),
      page("/tag/mutou/", `<main><a href="/"></a></main>`),
      page("/drink/a/", `<main><a href="/"></a><a href="/tag/mutou/"></a></main>`),
    ],
    [],
  );
  if (scriptOnly.issues.some((issue) => issue.includes("no inbound"))) {
    throw new Error(`self-test: a script href was counted, or a real link was missed: ${scriptOnly.issues.join("; ")}`);
  }
  if ((scriptOnly.contentInbound.get("/tag/mutou/")?.size ?? 0) !== 1) {
    throw new Error("self-test: the in-content tag link was dropped");
  }

  const wrongCanonical = linkIssues(
    [page("/drink/a/", `<main><a href="/drink/b/"></a></main>`, `${ORIGIN}/drink/b/`), page("/drink/b/", `<main><a href="/drink/a/"></a></main>`)],
    [`${ORIGIN}/drink/a/`],
  );
  if (!wrongCanonical.issues.some((issue) => issue.includes("not self-canonical"))) {
    throw new Error(`self-test: a non-self-canonical sitemap URL was accepted: ${wrongCanonical.issues.join("; ")}`);
  }

  const noindex = linkIssues(
    [
      {
        route: "/drink/shell/",
        html: `<meta name="robots" content="noindex, follow"/><link rel="canonical" href="${ORIGIN}/drink/shell/"/><main><a href="/"></a></main>`,
        canonical: `${ORIGIN}/drink/shell/`,
        noindex: true,
      },
      page("/", `<main><a href="/drink/shell/"></a></main>`),
    ],
    [`${ORIGIN}/drink/shell/`],
  );
  if (!noindex.issues.some((issue) => issue.includes("noindex"))) {
    throw new Error(`self-test: a noindex sitemap URL was accepted: ${noindex.issues.join("; ")}`);
  }
  if (noindex.issues.some((issue) => issue.includes("no inbound"))) {
    throw new Error(`self-test: the shell was required to have inbound links: ${noindex.issues.join("; ")}`);
  }

  if (pageKind("/ba/office/") !== "scene" || pageKind("/drink/") !== "top" || pageKind("/category/citrus/") !== "category") {
    throw new Error("self-test: page kinds were wrong");
  }
  if (normalizeHref("https://stylish.sunsup.me/tag/mutou/") !== "/tag/mutou/" || normalizeHref("/drink/a") !== "/drink/a/") {
    throw new Error("self-test: href normalization drifted");
  }
}

function routeOf(rel) {
  if (rel === "404.html" || rel.startsWith("_next/")) return null;
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return null;
}

function walkHtml(dir, prefix = "") {
  /** @type {string[]} */
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "_next") continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...walkHtml(join(dir, entry.name), rel));
    else if (entry.name.endsWith(".html")) found.push(rel);
  }
  return found;
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1] ?? "");
}

function sitemapLocs() {
  const indexXml = readFileSync(join("out", "sitemap.xml"), "utf8");
  /** @type {string[]} */
  const found = [];
  for (const loc of locs(indexXml).filter((item) => item.endsWith(".xml"))) {
    const name = loc.startsWith(`${ORIGIN}/`) ? loc.slice(ORIGIN.length + 1) : "";
    if (!name || name.includes("/") || name.includes("..")) {
      throw new Error(`sitemap index loc is not a site-root file: ${loc}`);
    }
    found.push(...locs(readFileSync(join("out", name), "utf8")));
  }
  return found;
}

function checkExport(root = "out") {
  selfTestInternalLinks();
  if (!existsSync(join(root, "index.html"))) {
    console.error("internal link check needs out/ from npm run build");
    process.exit(1);
  }
  /** @type {{ route: string, html: string, canonical: string, noindex: boolean }[]} */
  const pages = [];
  for (const rel of walkHtml(root)) {
    const route = routeOf(rel);
    if (!route) continue;
    const html = readFileSync(join(root, rel), "utf8");
    pages.push({ route, html, canonical: canonicalOf(html), noindex: isNoindex(html) });
  }
  const result = linkIssues(pages, sitemapLocs());
  const zeroSummary = KINDS.map((kind) => `${kind} ${result.zeros[kind]}/${result.totals[kind]}`).join(", ");
  const contentSummary = `tag ${result.contentZeros.tag}/${result.totals.tag}, category ${result.contentZeros.category}/${result.totals.category}`;
  if (result.issues.length > 0) {
    console.error(`internal links: zero-inbound ${zeroSummary}`);
    console.error(`in-content zero (tag, category): ${contentSummary}`);
    for (const issue of result.issues.slice(0, 40)) {
      console.error(`✗ ${issue}`);
    }
    if (result.issues.length > 40) {
      console.error(`…and ${result.issues.length - 40} more`);
    }
    process.exit(1);
  }
  const tagSources = result.contentInbound.get("/tag/mutou/")?.size ?? 0;
  console.log(`internal links ok: zero-inbound ${zeroSummary}`);
  console.log(`in-content zero (tag, category): ${contentSummary}; /tag/mutou/ in-content sources ${tagSources}`);
  console.log(`sitemap canonical ok: ${sitemapLocs().length} urls`);
}

checkExport();
