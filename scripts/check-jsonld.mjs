// Checks schema.org JSON-LD after `npm run build`.
// Every exported route (out/**/index.html) must parse, carry the STYLISH! Organization,
// and carry one WebPage or CollectionPage whose isPartOf is the WebSite and whose publisher
// is that Organization. Name and description must match the page's title and meta description.
// Category, tag and /ba/ pages, including /ba/office/, keep an ItemList of drink URLs.
// A Product must have a name, and a drink page's Product still comes only from catalog facts
// (no price, offer, rating, review or brand).
// Next also writes 404.html, the status-code copy of /404/. That file is not a second route.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const failures = [];
const fail = (message) => failures.push(message);

const ALLOWED_TYPES = new Set(["Organization", "WebPage", "CollectionPage", "WebSite", "BreadcrumbList", "ItemList", "Product"]);
const PRODUCT_KEYS = new Set(["@context", "@type", "@id", "name", "description", "url", "category", "image", "size"]);
const INVENTED = ["offers", "price", "priceCurrency", "aggregateRating", "review", "brand"];

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

function expectedKind(route) {
  if (route === "/drink/" || route.startsWith("/category/") || route.startsWith("/ba/") || route.startsWith("/tag/")) {
    return "CollectionPage";
  }
  return "WebPage";
}

/** Problems in one page's JSON-LD. `route` is the canonical path, such as "/" or "/about/". */
export function pageProblems(html, route, origin) {
  const problems = [];
  const problem = (message) => problems.push(`${route} ${message}`);
  const websiteId = `${origin}/#website`;
  const organizationId = `${origin}/#organization`;
  const logoUrl = `${origin}/brand/stylish-mark.svg`;
  const pageUrl = `${origin}${route}`;

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const title = titleMatch ? decode(titleMatch[1]) : "";
  const descriptionTag = html.match(/<meta\b[^>]*name="description"[^>]*>/);
  const descriptionContent = descriptionTag?.[0].match(/\bcontent="([^"]*)"/);
  const description = descriptionContent ? decode(descriptionContent[1]) : "";
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";
  if (!title) {
    problem("has no title");
  }
  if (!description) {
    problem("has no meta description");
  }
  if (canonical && canonical !== pageUrl) {
    problem("canonical does not match the route");
  }

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  if (blocks.length === 0) {
    problem("has no JSON-LD");
    return problems;
  }
  let items;
  try {
    items = blocks.map((text) => JSON.parse(text));
  } catch {
    problem("JSON-LD does not parse");
    return problems;
  }
  if (items.some((item) => item === null || typeof item !== "object" || Array.isArray(item))) {
    problem("JSON-LD node is not an object");
    return problems;
  }

  for (const item of items) {
    if (item["@context"] !== "https://schema.org") {
      problem(`${item["@type"]} has the wrong @context`);
    }
    if (!ALLOWED_TYPES.has(item["@type"])) {
      problem(`has unexpected JSON-LD type ${item["@type"]}`);
    }
  }

  const organizations = items.filter((item) => item["@type"] === "Organization");
  if (organizations.length !== 1) {
    problem("needs exactly one Organization");
  } else {
    const organization = organizations[0];
    if (organization["@id"] !== organizationId || organization.name !== "STYLISH!" || organization.url !== `${origin}/`) {
      problem("Organization @id, name or url is not the STYLISH! publisher");
    }
    if (organization.logo !== logoUrl) {
      problem("Organization logo is not /brand/stylish-mark.svg");
    }
  }

  const pages = items.filter((item) => item["@type"] === "WebPage" || item["@type"] === "CollectionPage");
  const kind = expectedKind(route);
  if (pages.length !== 1 || pages[0]["@type"] !== kind) {
    problem(`needs one ${kind}`);
  } else {
    const page = pages[0];
    const partOf = page.isPartOf?.["@id"] ?? page.isPartOf;
    const publisher = page.publisher?.["@id"] ?? page.publisher;
    if (partOf !== websiteId) {
      problem("isPartOf is not the WebSite");
    }
    if (publisher !== organizationId) {
      problem("publisher is not the Organization");
    }
    if (page.url !== pageUrl) {
      problem("url does not match the page");
    }
    if (title && page.name !== title) {
      problem("name does not match the title");
    }
    if (description && page.description !== description) {
      problem("description does not match the meta description");
    }
  }

  const sites = items.filter((item) => item["@type"] === "WebSite");
  if (route === "/" && sites.length !== 1) {
    problem("needs one WebSite");
  }
  for (const site of sites) {
    if (site["@id"] !== websiteId) {
      problem("WebSite @id is not stable");
    }
    const publisher = site.publisher?.["@id"] ?? site.publisher;
    if (publisher !== organizationId) {
      problem("WebSite.publisher is not the Organization");
    }
  }

  if (route.startsWith("/category/") || route.startsWith("/ba/") || route.startsWith("/tag/")) {
    const lists = items.filter((item) => item["@type"] === "ItemList");
    const entries = lists[0]?.itemListElement;
    if (lists.length !== 1 || !Array.isArray(entries) || entries.length < 1) {
      problem("needs an ItemList with at least one drink");
    } else if (entries.some((entry) => typeof entry?.url !== "string" || !entry.url.startsWith(`${origin}/drink/`))) {
      problem("ItemList entries must be drink URLs");
    }
    if (route === "/ba/office/") {
      const listed = (Array.isArray(entries) ? entries : []).map((entry, index) => {
        const url = typeof entry?.url === "string" ? entry.url : "";
        const slug = url.startsWith(`${origin}/drink/`) ? url.slice(`${origin}/drink/`.length).replace(/\/$/, "") : "";
        const numbered = entry?.["@type"] === "ListItem" && entry.position === index + 1;
        return numbered ? slug : "";
      });
      // The labeled lists are the drink showcases. Journey links outside them are not part of the list.
      // ItemList keeps the first occurrence of each drink when a page shows one twice.
      const linked = [];
      const seen = new Set();
      for (const showcase of html.matchAll(/<ul\b[^>]*\baria-label="[^"]*"[^>]*>[\s\S]*?<\/ul>/g)) {
        for (const match of showcase[0].matchAll(/href="\/drink\/([a-z0-9-]+)\/"/g)) {
          if (seen.has(match[1])) continue;
          seen.add(match[1]);
          linked.push(match[1]);
        }
      }
      if (listed.length < 1 || listed.some((slug) => slug === "") || listed.join() !== linked.join()) {
        problem("ItemList does not match the drinks on the page");
      }
    }
  }

  for (const item of items) {
    if (item["@type"] === "Product" && (typeof item.name !== "string" || item.name.trim() === "")) {
      problem("Product lacks a name");
    }
  }

  return problems;
}

function selfTest() {
  const origin = "https://stylish.sunsup.me";
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: "STYLISH!",
    url: `${origin}/`,
    logo: `${origin}/brand/stylish-mark.svg`,
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    name: "STYLISH!",
    url: `${origin}/`,
    publisher: { "@id": `${origin}/#organization` },
  };
  const homePage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${origin}/#webpage`,
    url: `${origin}/`,
    name: "STYLISH!",
    description: "desc",
    isPartOf: { "@id": `${origin}/#website` },
    publisher: { "@id": `${origin}/#organization` },
  };
  const script = (node) => `<script type="application/ld+json">${JSON.stringify(node)}</script>`;
  const shell = (nodes) => `<title>STYLISH!</title><meta name="description" content="desc"/>${nodes.map(script).join("")}`;

  const oldHome = pageProblems(`${shell([website])}<link rel="canonical" href="${origin}/"/>`, "/", origin);
  if (!oldHome.some((message) => message.includes("Organization")) || !oldHome.some((message) => message.includes("WebPage"))) {
    throw new Error("self-test: a WebSite-only home page was not rejected");
  }

  const goodHome = pageProblems(`${shell([organization, website, homePage])}<link rel="canonical" href="${origin}/"/>`, "/", origin);
  if (goodHome.length > 0) {
    throw new Error(`self-test: a complete home graph was rejected (${goodHome.join("; ")})`);
  }

  const category = pageProblems(
    `<title>柑橘｜STYLISH!</title><meta name="description" content="desc"/><link rel="canonical" href="${origin}/category/citrus/"/>${script(organization)}${script({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      url: `${origin}/category/citrus/`,
      name: "柑橘｜STYLISH!",
      description: "desc",
      isPartOf: { "@id": `${origin}/#website` },
      publisher: { "@id": `${origin}/#organization` },
    })}`,
    "/category/citrus/",
    origin,
  );
  if (!category.some((message) => message.includes("ItemList"))) {
    throw new Error("self-test: a category page without an ItemList was accepted");
  }

  const tag = pageProblems(
    `<title>無糖のドリンク｜STYLISH!</title><meta name="description" content="desc"/><link rel="canonical" href="${origin}/tag/mutou/"/>${script(organization)}${script({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      url: `${origin}/tag/mutou/`,
      name: "無糖のドリンク｜STYLISH!",
      description: "desc",
      isPartOf: { "@id": `${origin}/#website` },
      publisher: { "@id": `${origin}/#organization` },
    })}`,
    "/tag/mutou/",
    origin,
  );
  if (!tag.some((message) => message.includes("ItemList"))) {
    throw new Error("self-test: a tag page without an ItemList was accepted");
  }

  const office = pageProblems(
    `<title>オフィスのオープンな飲み会｜STYLISH!</title><meta name="description" content="desc"/><link rel="canonical" href="${origin}/ba/office/"/>${script(organization)}${script({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      url: `${origin}/ba/office/`,
      name: "オフィスのオープンな飲み会｜STYLISH!",
      description: "desc",
      isPartOf: { "@id": `${origin}/#website` },
      publisher: { "@id": `${origin}/#organization` },
    })}`,
    "/ba/office/",
    origin,
  );
  if (!office.some((message) => message.includes("ItemList"))) {
    throw new Error("self-test: /ba/office/ without an ItemList was accepted");
  }

  const officeGraph = (nodes, body = "") =>
    `<title>オフィスのオープンな飲み会｜STYLISH!</title><meta name="description" content="desc"/><link rel="canonical" href="${origin}/ba/office/"/>${body}${nodes.map(script).join("")}`;
  const officePage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url: `${origin}/ba/office/`,
    name: "オフィスのオープンな飲み会｜STYLISH!",
    description: "desc",
    isPartOf: { "@id": `${origin}/#website` },
    publisher: { "@id": `${origin}/#organization` },
  };
  const officeList = (...slugs) => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: slugs.map((slug, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: slug,
      url: `${origin}/drink/${slug}/`,
    })),
  });
  const officeMismatch = pageProblems(
    officeGraph(
      [organization, officePage, officeList("kimino-yuzu", "other")],
      `<ul aria-label="この飲み会のドリンク"><a href="/drink/kimino-yuzu/"></a></ul>`,
    ),
    "/ba/office/",
    origin,
  );
  if (!officeMismatch.some((message) => message.includes("ItemList"))) {
    throw new Error("self-test: /ba/office/ ItemList that does not match the page was accepted");
  }
  const officeReversed = pageProblems(
    officeGraph(
      [
        organization,
        officePage,
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "a", url: `${origin}/drink/aaa/` },
            { "@type": "ListItem", position: 2, name: "b", url: `${origin}/drink/bbb/` },
          ],
        },
      ],
      `<ul aria-label="この飲み会のドリンク"><a href="/drink/bbb/"></a><a href="/drink/aaa/"></a></ul>`,
    ),
    "/ba/office/",
    origin,
  );
  if (!officeReversed.some((message) => message.includes("does not match the drinks"))) {
    throw new Error("self-test: /ba/office/ ItemList in a different order from the page was accepted");
  }
  const officeMatch = pageProblems(
    officeGraph(
      [organization, officePage, officeList("kimino-yuzu", "kagome-grape-100")],
      `<a href="/drink/kimino-yuzu/">歩</a><ul aria-label="この飲み会のドリンク"><a href="/drink/kimino-yuzu/"></a><a href="/drink/kagome-grape-100/"></a></ul><ul aria-label="秋のおすすめ"><a href="/drink/kagome-grape-100/"></a></ul><a href="/drink/other/">見る</a>`,
    ),
    "/ba/office/",
    origin,
  );
  if (officeMatch.length > 0) {
    throw new Error(`self-test: /ba/office/ ItemList matching the page was rejected (${officeMatch.join("; ")})`);
  }
  const officeDup = pageProblems(
    officeGraph(
      [organization, officePage, officeList("kimino-yuzu", "kagome-grape-100", "kagome-grape-100")],
      `<ul aria-label="この飲み会のドリンク"><a href="/drink/kimino-yuzu/"></a><a href="/drink/kagome-grape-100/"></a></ul><ul aria-label="秋のおすすめ"><a href="/drink/kagome-grape-100/"></a></ul>`,
    ),
    "/ba/office/",
    origin,
  );
  if (!officeDup.some((message) => message.includes("does not match the drinks"))) {
    throw new Error("self-test: /ba/office/ ItemList with a duplicate drink was accepted");
  }

  const nameless = pageProblems(
    `${shell([
      organization,
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        url: `${origin}/drink/x/`,
        name: "STYLISH!",
        description: "desc",
        isPartOf: { "@id": `${origin}/#website` },
        publisher: { "@id": `${origin}/#organization` },
      },
      { "@context": "https://schema.org", "@type": "Product", name: "  " },
    ])}<link rel="canonical" href="${origin}/drink/x/"/>`,
    "/drink/x/",
    origin,
  );
  if (!nameless.some((message) => message.includes("Product lacks a name"))) {
    throw new Error("self-test: a Product without a name was accepted");
  }
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

function walk(dir, prefix = "") {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "_next") {
      continue;
    }
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      found.push(...walk(join(dir, entry.name), rel));
    } else {
      found.push(rel);
    }
  }
  return found;
}

function routeFrom(rel) {
  if (rel === "index.html") {
    return "/";
  }
  if (rel.endsWith("/index.html")) {
    return `/${rel.slice(0, -"index.html".length)}`;
  }
  return null;
}

selfTest();

if (!existsSync(join("out", "index.html"))) {
  console.error("json-ld check needs out/ from npm run build");
  process.exit(1);
}

const homeHtml = readFileSync(join("out", "index.html"), "utf8");
const origin = homeHtml.match(/<link rel="canonical" href="(https:\/\/[^/"]+)/)?.[1] ?? "";
if (!origin) {
  fail("home page has no canonical origin");
}

const htmlFiles = walk("out").filter((rel) => rel.endsWith(".html"));
const routes = [];
for (const rel of htmlFiles) {
  if (rel === "404.html") {
    continue;
  }
  const route = routeFrom(rel);
  if (!route) {
    fail(`unexpected exported html out/${rel}`);
    continue;
  }
  routes.push(route);
}

const [header, ...csvRows] = parseCsv(readFileSync(join("data", "drinks.csv"), "utf8"));
const drinks = csvRows.map((row) => Object.fromEntries(header.map((key, index) => [key, row[index] ?? ""])));
const publicDrinks = new Map(drinks.filter((drink) => drink["公開"] === "1").map((drink) => [drink.slug, drink]));
const seenDrinks = new Set();
let sized = 0;

if (!existsSync(join("out", "brand", "stylish-mark.svg"))) {
  fail("Organization logo out/brand/stylish-mark.svg is missing");
}

for (const route of routes) {
  const rel = route === "/" ? "index.html" : `${route.slice(1)}index.html`;
  const html = readFileSync(join("out", rel), "utf8");
  if (origin) {
    for (const message of pageProblems(html, route, origin)) {
      fail(message);
    }
  }

  const slug = route.startsWith("/drink/") ? route.slice("/drink/".length, -1) : "";
  const drink = publicDrinks.get(slug);
  if (!drink) {
    continue;
  }
  seenDrinks.add(slug);
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  let items;
  try {
    items = blocks.map((text) => JSON.parse(text));
  } catch {
    continue;
  }
  const product = items.find((item) => item["@type"] === "Product");
  const crumbs = items.find((item) => item["@type"] === "BreadcrumbList");
  const types = items.map((item) => item["@type"]).sort();
  const expectedTypes = ["BreadcrumbList", "Organization", "Product", "WebPage"];
  if (!product || !crumbs || types.join() !== expectedTypes.join()) {
    fail(`/drink/${drink.slug}/ needs Organization, WebPage, Product and BreadcrumbList`);
    continue;
  }
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";
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

for (const slug of publicDrinks.keys()) {
  if (!seenDrinks.has(slug)) {
    fail(`/drink/${slug}/ was not exported`);
  }
}

if (failures.length > 0) {
  for (const message of failures.slice(0, 50)) {
    console.error(`✗ ${message}`);
  }
  console.error(`${failures.length} JSON-LD problems`);
  process.exit(1);
}
console.log(`json-ld ok: ${routes.length} routes, ${publicDrinks.size} drink pages, ${sized} with a size`);
