// Checks the exported category pages under /category/<id>/ (run after `npm run build`).
// Each page lists every public drink of its category, the ItemList matches the links on the page,
// the breadcrumbs end at the page, the page is in the sitemap, every drink links back to it,
// and its first image shows only drinks of the page with no print pixel repainted.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const failures = [];
const fail = (message) => failures.push(message);
const read = (path) => readFileSync(join("out", path), "utf8");

const sitemap = read("sitemap.xml");
const origin = (read("robots.txt").match(/Sitemap: (https:\/\/[^/]+)\//) ?? [])[1] ?? "";
const root = join("out", "category");
const ids = existsSync(root)
  ? readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  : [];

if (ids.length === 0) {
  fail("no category pages under out/category/");
}

const fidelityPath = join(process.cwd(), "stills", "category-hero-fidelity.json");
const fidelity = existsSync(fidelityPath) ? JSON.parse(readFileSync(fidelityPath, "utf8")) : {};
const drinkList = read("drink/index.html");

for (const id of ids) {
  const path = `/category/${id}/`;
  const url = `${origin}${path}`;
  const html = read(`category/${id}/index.html`);
  if (!html.includes(`<link rel="canonical" href="${url}"/>`)) {
    fail(`${path} is missing its canonical`);
  }
  if (!sitemap.includes(`<loc>${url}</loc>`)) {
    fail(`${path} is not in the sitemap`);
  }
  if (!drinkList.includes(`href="${path}"`)) {
    fail(`/drink/ does not link to ${path}`);
  }
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
  if (!title || !description || description.length > 120) {
    fail(`${path} needs a title and a description of up to 120 characters`);
  }
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const list = blocks.find((item) => item["@type"] === "ItemList");
  const crumbs = blocks.find((item) => item["@type"] === "BreadcrumbList");
  if (!list || !crumbs || blocks.some((item) => item["@context"] !== "https://schema.org")) {
    fail(`${path} needs an ItemList and a BreadcrumbList on https://schema.org`);
    continue;
  }
  if (crumbs.itemListElement.at(-1)?.item !== url) {
    fail(`${path} breadcrumbs do not end at the page`);
  }
  const linked = new Set([...html.matchAll(/href="\/drink\/([a-z0-9-]+)\/"/g)].map((m) => m[1]));
  const listed = list.itemListElement.map((item, index) => {
    if (item["@type"] !== "ListItem" || item.position !== index + 1) {
      fail(`${path} ItemList entry ${index + 1} is not a numbered ListItem`);
    }
    return item.url.replace(`${origin}/drink/`, "").replace(/\/$/, "");
  });
  if (list.numberOfItems !== listed.length || new Set(listed).size !== listed.length) {
    fail(`${path} ItemList count or entries are off`);
  }
  // The category of each drink page is in its breadcrumb; every drink of this category must be on the page.
  let members = 0;
  for (const entry of readdirSync(join("out", "drink"), { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const page = join("out", "drink", entry.name, "index.html");
    if (!existsSync(page)) {
      continue;
    }
    const drinkHtml = readFileSync(page, "utf8");
    const backLink = drinkHtml.includes(`href="${path}"`);
    const inCrumb = drinkHtml.includes(`"item":"${url}"`);
    if (inCrumb) {
      members += 1;
      if (!listed.includes(entry.name)) {
        fail(`${path} leaves out ${entry.name}`);
      }
    }
    if (listed.includes(entry.name)) {
      if (!backLink || !inCrumb) {
        fail(`/drink/${entry.name}/ does not link back to ${path}`);
      }
      if (!linked.has(entry.name)) {
        fail(`${path} ItemList has ${entry.name} but the page does not link it`);
      }
    }
  }
  if (members !== listed.length) {
    fail(`${path} lists ${listed.length} drinks, the catalog has ${members}`);
  }
  const hero = fidelity[id];
  if (!hero) {
    fail(`${path} has no hero fidelity record`);
  }
  for (const [drink, result] of Object.entries(hero ?? {})) {
    if (!listed.includes(drink)) {
      fail(`hero of ${path} shows ${drink}, which the page does not list`);
    }
    if (result.print_maxdiff !== 0) {
      fail(`hero of ${path} repainted the print of ${drink}`);
    }
  }
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(`✗ ${message}`);
  }
  process.exit(1);
}
console.log(`categories ok: ${ids.length} category page(s)`);
