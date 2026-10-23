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

// Tonics and ginger beers stay listed, but never open a shelf and never stand in a first image.
const MIXER = /トニック|ジンジャー ?ビア|tonic|ginger ?beer/i;
const FIRST_ROW = 4;
const names = new Map();

/** Drink slugs in page order inside each <section id="...">. */
function shelves(html) {
  const out = new Map();
  for (const part of html.split(/<section\b/).slice(1)) {
    const id = part.match(/^[^>]*\bid="([^"]+)"/)?.[1];
    if (!id) {
      continue;
    }
    out.set(id, [...new Set([...part.matchAll(/href="\/drink\/([a-z0-9-]+)\/"/g)].map((m) => m[1]))]);
  }
  return out;
}

function checkFirstRows(path, html, ids) {
  for (const [id, slugs] of shelves(html)) {
    if (ids && !ids.includes(id)) {
      continue;
    }
    if (slugs.length <= FIRST_ROW) {
      continue;
    }
    const opening = slugs.slice(0, FIRST_ROW).filter((slug) => MIXER.test(names.get(slug) ?? ""));
    if (opening.length > 0) {
      fail(`${path} opens the #${id} shelf with ${opening.join(", ")}`);
    }
  }
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
    const slug = item.url.replace(`${origin}/drink/`, "").replace(/\/$/, "");
    names.set(slug, item.name);
    return slug;
  });
  checkFirstRows(path, html, ["bottle", "big", "can", "pet", "carton", "other"]);
  // In list order (the shelf shows drinks with a photo first, then the rest), tonics and ginger beers come last.
  const firstMixer = listed.findIndex((slug) => MIXER.test(names.get(slug) ?? ""));
  if (firstMixer >= 0 && listed.slice(firstMixer).some((slug) => !MIXER.test(names.get(slug) ?? ""))) {
    fail(`${path}: tonics and ginger beers must come after every other drink`);
  }
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
    if (MIXER.test(names.get(drink) ?? "")) {
      fail(`hero of ${path} shows ${drink}, a tonic or ginger beer`);
    }
    if (result.print_maxdiff !== 0) {
      fail(`hero of ${path} repainted the print of ${drink}`);
    }
  }
}

// The drink list opens each shelf the same way.
checkFirstRows("/drink/", drinkList);

// Scene heroes: no tonic or ginger beer either.
const scenePath = join(process.cwd(), "stills", "scene-hero-fidelity.json");
if (existsSync(scenePath)) {
  for (const [scene, drinks] of Object.entries(JSON.parse(readFileSync(scenePath, "utf8")))) {
    for (const drink of Object.keys(drinks)) {
      if (MIXER.test(names.get(drink) ?? "")) {
        fail(`hero of /ba/${scene}/ shows ${drink}, a tonic or ginger beer`);
      }
    }
  }
}

// Category links go to the category pages, not to shelves of the list.
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : entry.name.endsWith(".html") ? [join(dir, entry.name)] : [],
  );
}
const stale = walk("out").filter((file) => readFileSync(file, "utf8").includes('href="/drink/#'));
if (stale.length > 0) {
  fail(`${stale.length} page(s) still link to /drink/#<category>, e.g. ${stale[0]}`);
}
if (ids.length !== 6) {
  fail(`expected 6 category pages, found ${ids.length}`);
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(`✗ ${message}`);
  }
  process.exit(1);
}
console.log(`categories ok: ${ids.length} category page(s)`);
