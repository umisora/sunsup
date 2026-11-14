// Lengths are reported. The build fails for banned wording, duplicate titles, an empty description,
// or a drink description over 120 characters. A drink description under 80 is counted and still passes.
// `out/404.html` is Next's copy of `/404/` and is not a second page.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const HOME_TITLE = "飲み会のノンアル、おしゃれに選ぶ｜STYLISH!";
const HOME_DESCRIPTION = "オフィスの飲み会を任された人が、定時後に出すノンアルコールを選ぶサイトです。";
const ABOUT_DESCRIPTION =
  "STYLISH!は、飲み会でもおしゃれに美味しく飲めるノンアルを紹介するサイトです。場・見た目・サイズ・味の四つから、幹事が次の一本を選べます。店へのリンクだけ載せています。";

const TITLE_OR_DESCRIPTION = ["飲まない人", "お酒を飲まない人", "酒の代わり"];
const DESCRIPTION_BANNED = ["ノンアルです"];

export function textLength(value) {
  return [...value].length;
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

/** `null` for the duplicate 404 file and for HTML that is not a route. */
export function routeOf(rel) {
  if (rel === "404.html" || rel.startsWith("_next/")) return null;
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return null;
}

export function isDrinkPage(route) {
  return /^\/drink\/[^/]+\/$/.test(route) && route !== "/drink/shell/";
}

/**
 * @param {{ route: string, title: string, description: string }[]} pages
 */
export function metaFindings(pages) {
  /** @type {string[]} */
  const failures = [];
  const titles = new Map();
  let longTitles = 0;
  let shortDrinkDescriptions = 0;
  let longDrinkDescriptions = 0;

  for (const page of pages) {
    const title = page.title;
    const description = page.description;
    if (textLength(title) > 32) longTitles += 1;
    if (!description.trim()) failures.push(`${page.route} description is empty`);
    for (const phrase of TITLE_OR_DESCRIPTION) {
      if (title.includes(phrase) || description.includes(phrase)) {
        failures.push(`${page.route} title or description contains 「${phrase}」`);
      }
    }
    for (const phrase of DESCRIPTION_BANNED) {
      if (description.includes(phrase)) failures.push(`${page.route} description contains 「${phrase}」`);
    }
    const seen = titles.get(title) ?? [];
    seen.push(page.route);
    titles.set(title, seen);
    if (isDrinkPage(page.route)) {
      const length = textLength(description);
      if (length < 80) shortDrinkDescriptions += 1;
      if (length > 120) {
        longDrinkDescriptions += 1;
        failures.push(`${page.route} description is over 120 characters`);
      }
    }
  }
  for (const [title, routes] of titles) {
    if (routes.length > 1) failures.push(`duplicate title 「${title}」 on ${routes.join(", ")}`);
  }

  const home = pages.find((page) => page.route === "/");
  const about = pages.find((page) => page.route === "/about/");
  if (!home || home.title !== HOME_TITLE) failures.push("home title is not the approved line");
  if (!home || home.description !== HOME_DESCRIPTION) failures.push("home description changed");
  if (!about || about.description !== ABOUT_DESCRIPTION) failures.push("about description is not the approved line");

  return { failures, longTitles, shortDrinkDescriptions, longDrinkDescriptions };
}

export function selfTestMeta() {
  const ok = {
    route: "/drink/sample/",
    title: "サンプル｜STYLISH!",
    description: "あ".repeat(80) + "。",
  };
  const home = { route: "/", title: HOME_TITLE, description: HOME_DESCRIPTION };
  const about = { route: "/about/", title: "このサイトについて｜STYLISH!", description: ABOUT_DESCRIPTION };
  const clean = metaFindings([home, about, ok]);
  if (clean.failures.length !== 0 || clean.longTitles !== 0 || clean.shortDrinkDescriptions !== 0 || clean.longDrinkDescriptions !== 0) {
    throw new Error(`self-test: a clean page was flagged: ${JSON.stringify(clean)}`);
  }
  const reported = metaFindings([
    home,
    about,
    { route: "/drink/long/", title: "あ".repeat(33), description: "あ".repeat(121) },
    { route: "/drink/short/", title: "短い｜STYLISH!", description: "あ".repeat(79) },
    { route: "/ba/office/", title: "場面｜STYLISH!", description: "短い説明です。" },
  ]);
  if (reported.failures.length !== 1 || !reported.failures[0].includes("/drink/long/") || !reported.failures[0].includes("over 120")) {
    throw new Error(`self-test: a drink description over 120 must fail the build: ${reported.failures.join("; ")}`);
  }
  if (reported.longTitles !== 1 || reported.shortDrinkDescriptions !== 1 || reported.longDrinkDescriptions !== 1) {
    throw new Error(`self-test: length counts were ${reported.longTitles}, ${reported.shortDrinkDescriptions}, ${reported.longDrinkDescriptions}`);
  }
  const banned = metaFindings([
    home,
    about,
    { route: "/drink/a/", title: "飲まない人｜STYLISH!", description: "あ".repeat(80) },
    { route: "/drink/b/", title: "別｜STYLISH!", description: "これは酒の代わりです。" },
    { route: "/drink/c/", title: "ノンアルです｜STYLISH!", description: "あ".repeat(80) },
    { route: "/drink/d/", title: "同じ｜STYLISH!", description: "" },
    { route: "/drink/e/", title: "同じ｜STYLISH!", description: "お酒を飲まない人向けです。ノンアルです。" },
  ]);
  const joined = banned.failures.join("\n");
  for (const phrase of ["飲まない人", "酒の代わり", "お酒を飲まない人", "ノンアルです", "description is empty", "duplicate title"]) {
    if (!joined.includes(phrase)) throw new Error(`self-test: missing failure for ${phrase}`);
  }
  if (joined.includes("/drink/c/ description contains")) {
    throw new Error("self-test: 「ノンアルです」 in a title was treated as a description failure");
  }
  if (routeOf("404.html") !== null || routeOf("index.html") !== "/" || routeOf("drink/kimino-yuzu/index.html") !== "/drink/kimino-yuzu/") {
    throw new Error("self-test: routeOf misread a path");
  }
  if (!isDrinkPage("/drink/kimino-yuzu/") || isDrinkPage("/drink/") || isDrinkPage("/drink/shell/")) {
    throw new Error("self-test: drink pages were classified wrong");
  }
}

function readMeta(html) {
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  const descriptionTag = html.match(/<meta\b[^>]*name="description"[^>]*>/);
  const description = decode(descriptionTag?.[0].match(/\bcontent="([^"]*)"/)?.[1] ?? "");
  return { title, description };
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

function printReport(findings) {
  const rows = [
    ["title over 32 characters", findings.longTitles],
    ["drink description under 80", findings.shortDrinkDescriptions],
    ["drink description over 120", findings.longDrinkDescriptions],
  ];
  const labelWidth = Math.max(...rows.map((row) => [...row[0]].length));
  console.log("meta length report");
  console.log(`| ${"measure".padEnd(labelWidth)} | count |`);
  console.log(`| ${"-".repeat(labelWidth)} | ----- |`);
  for (const [label, count] of rows) {
    console.log(`| ${label.padEnd(labelWidth)} | ${String(count).padStart(5)} |`);
  }
}

function checkExport(root = "out") {
  selfTestMeta();
  if (!existsSync(join(root, "index.html"))) {
    console.error(`meta check needs ${root}/ from npm run build`);
    process.exit(1);
  }
  const pages = [];
  for (const rel of walkHtml(root)) {
    const route = routeOf(rel);
    if (!route) continue;
    const html = readFileSync(join(root, rel), "utf8");
    pages.push({ route, ...readMeta(html) });
  }
  const findings = metaFindings(pages);
  printReport(findings);
  if (findings.failures.length > 0) {
    for (const message of findings.failures.slice(0, 40)) console.error(message);
    if (findings.failures.length > 40) console.error(`…and ${findings.failures.length - 40} more meta failures`);
    process.exit(1);
  }
  console.log(`meta ok: ${pages.length} pages, banned wording clear, titles unique, descriptions present`);
}

checkExport();
