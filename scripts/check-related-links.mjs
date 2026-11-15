// Fails the build unless every published drink is linked as href="/drink/<slug>/"
// from the same-category list on at least one other drink page, and each of those
// lists links at most 8 drinks.
// The list is the DrinkShowcase ul (aria-label="同じカテゴリ") in out/drink/<slug>/index.html.
// /drink/shell/ is not a drink page. _next and the manifest are left unread.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const RELATED_LIMIT = 8;

/**
 * Same-category lists on one drink page, in document order.
 * Each list is the drink slugs linked from that showcase.
 * @param {string} html
 * @returns {string[][]}
 */
export function relatedLists(html) {
  const showcase = /<ul\b[^>]*\baria-label="同じカテゴリ"[^>]*>([\s\S]*?)<\/ul>/g;
  const drinkHref = /href="\/drink\/([a-z0-9-]+)\/"/g;
  /** @type {string[][]} */
  const lists = [];
  for (const match of html.matchAll(showcase)) {
    lists.push([...(match[1] ?? "").matchAll(drinkHref)].map((link) => link[1] ?? ""));
  }
  return lists;
}

/**
 * @param {{ slug: string, html: string }[]} pages
 * @returns {string[]}
 */
export function relatedLinkIssues(pages) {
  /** @type {Map<string, Set<string>>} */
  const inbound = new Map(pages.map((page) => [page.slug, new Set()]));
  /** @type {string[]} */
  const issues = [];

  for (const page of pages) {
    const lists = relatedLists(page.html);
    /** @type {Set<string>} */
    const linked = new Set();
    for (const list of lists) {
      if (list.length > RELATED_LIMIT) {
        issues.push(`${page.slug} links ${list.length} related drinks, over ${RELATED_LIMIT}`);
      }
      for (const slug of list) {
        linked.add(slug);
      }
    }
    if (linked.size > RELATED_LIMIT) {
      issues.push(`${page.slug} links ${linked.size} related drinks, over ${RELATED_LIMIT}`);
    }
    for (const slug of linked) {
      if (slug === page.slug) {
        continue;
      }
      const sources = inbound.get(slug);
      if (!sources) {
        issues.push(`${page.slug} links /drink/${slug}/, which is not a published drink page`);
        continue;
      }
      sources.add(page.slug);
    }
  }

  for (const page of pages) {
    const sources = inbound.get(page.slug);
    if (!sources || sources.size === 0) {
      issues.push(`${page.slug} has no inbound link from another drink page`);
    }
  }

  return issues;
}

function showcase(targets) {
  return `<ul aria-label="同じカテゴリ">${targets.map((slug) => `<a href="/drink/${slug}/"></a>`).join("")}</ul>`;
}

/** The checker must reject a drink nobody links, and a list longer than 8. */
export function selfTestRelatedLinks() {
  const covered = relatedLinkIssues([
    { slug: "a", html: showcase(["b"]) },
    { slug: "b", html: showcase(["a"]) },
  ]);
  if (covered.length !== 0) {
    throw new Error(`self-test: a two-drink window should cover both pages: ${covered.join("; ")}`);
  }

  const trailOnly = relatedLinkIssues([
    {
      slug: "a",
      html: `<nav aria-label="前後"><a href="/drink/b/"></a></nav>${showcase(["a"])}`,
    },
    { slug: "b", html: showcase(["b"]) },
  ]);
  if (!trailOnly.some((message) => message.includes("b has no inbound"))) {
    throw new Error(`self-test: a trail link was treated as a related link: ${trailOnly.join("; ")}`);
  }

  const nine = ["b", "c", "d", "e", "f", "g", "h", "i", "j"];
  const over = relatedLinkIssues([
    { slug: "a", html: showcase(nine) },
    ...nine.map((slug) => ({ slug, html: showcase(["a"]) })),
  ]);
  if (!over.some((message) => message.startsWith("a links 9 related"))) {
    throw new Error(`self-test: nine related drinks were accepted: ${over.join("; ")}`);
  }

  const duplicated = relatedLinkIssues([
    { slug: "a", html: `${showcase(["b"])}${showcase(["b"])}` },
    { slug: "b", html: `${showcase(["a"])}${showcase(["a"])}` },
  ]);
  if (duplicated.length !== 0) {
    throw new Error(`self-test: a repeated showcase of one drink was rejected: ${duplicated.join("; ")}`);
  }

  const unpublished = relatedLinkIssues([
    { slug: "a", html: showcase(["missing"]) },
    { slug: "b", html: showcase(["a"]) },
  ]);
  if (!unpublished.some((message) => message.includes("not a published drink page"))) {
    throw new Error(`self-test: a link to an unpublished slug was accepted: ${unpublished.join("; ")}`);
  }
}

function checkExport(root = "out") {
  selfTestRelatedLinks();
  const dir = join(root, "drink");
  if (!existsSync(dir)) {
    console.error(`missing ${dir}`);
    process.exit(1);
  }
  /** @type {{ slug: string, html: string }[]} */
  const pages = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "shell" || entry.name === "_next") {
      continue;
    }
    const file = join(dir, entry.name, "index.html");
    if (!existsSync(file)) {
      continue;
    }
    pages.push({ slug: entry.name, html: readFileSync(file, "utf8") });
  }
  if (pages.length === 0) {
    console.error(`${dir} has no drink pages`);
    process.exit(1);
  }
  const issues = relatedLinkIssues(pages);
  if (issues.length > 0) {
    for (const message of issues.slice(0, 20)) {
      console.error(message);
    }
    if (issues.length > 20) {
      console.error(`…and ${issues.length - 20} more related-link failures`);
    }
    process.exit(1);
  }
  console.log(`related links ok: ${pages.length} drink pages, each linked from another drink page, at most ${RELATED_LIMIT} related`);
}

checkExport();
