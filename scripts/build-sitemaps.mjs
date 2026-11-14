// Writes public/sitemap.xml (index), sitemap-pages.xml and sitemap-drinks.xml
// before `next build` copies public/ into the static export.
//
// lastmod is the Asia/Tokyo calendar date of the latest git commit that touched
// the source that owns that URL. It is omitted when that date would be wrong:
// a shallow clone (blame stamps the boundary commit), an uncommitted line,
// a page whose HTML follows the build clock, or a drink whose hero still does.
// Cloudflare Pages sets CF_PAGES=1 and clones with depth 1. This script fetches
// the missing history before blame. If that fetch fails, lastmod is omitted and
// the build still succeeds. Other builds do not set CF_PAGES, so they are unchanged.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, existsSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SITE_ORIGIN, sitemapDrinkPaths, sitemapPagePaths } from "../lib/sitemap-entries.ts";
import { MUTOU } from "../lib/tags.ts";

const ZERO = "0000000000000000000000000000000000000000";
const DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
// History past the shallow boundary. 2000 reaches the root if the remote rejects
// --unshallow but still accepts a deeper fetch. When the root is included, git
// drops the shallow mark. A still-shallow clone omits lastmod rather than dating
// every URL with the boundary commit.
const PAGES_HISTORY_DEEPEN = 2000;
const PAGES_FETCH_TIMEOUT_MS = 30000;

function gitText(args, timeout) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  }).trim();
}

function gitFailureLine(error) {
  const stderr = error && typeof error === "object" && "stderr" in error ? String(error.stderr).trim() : "";
  const line = stderr
    .split("\n")
    .map((item) => item.trim())
    .find(Boolean);
  if (line) {
    return line.slice(0, 300);
  }
  const message = error instanceof Error ? error.message : String(error);
  return message.split("\n")[0].slice(0, 300);
}

// Runs only after this process holds the sitemap lock, so a second `next build`
// config evaluation waits and reuses the dated files.
function ensurePagesGitHistory() {
  if (process.env.CF_PAGES !== "1") {
    return;
  }
  let shallow;
  try {
    shallow = gitText(["rev-parse", "--is-shallow-repository"]);
  } catch (error) {
    console.warn(`[sitemaps] not fetching history (${gitFailureLine(error)}).`);
    return;
  }
  if (shallow !== "true") {
    return;
  }

  const attempts = [
    ["fetch", "--unshallow"],
    ["fetch", `--deepen=${PAGES_HISTORY_DEEPEN}`],
  ];
  for (const args of attempts) {
    const command = `git ${args.join(" ")}`;
    try {
      gitText(args, PAGES_FETCH_TIMEOUT_MS);
    } catch (error) {
      console.warn(`[sitemaps] ${command} failed (${gitFailureLine(error)}).`);
      continue;
    }
    try {
      if (gitText(["rev-parse", "--is-shallow-repository"]) === "false") {
        console.log(`[sitemaps] ${command} completed; using full history for lastmod.`);
        return;
      }
    } catch (error) {
      console.warn(`[sitemaps] could not recheck history after ${command} (${gitFailureLine(error)}).`);
      return;
    }
    console.warn(`[sitemaps] ${command} finished but the clone is still shallow.`);
  }
  console.warn("[sitemaps] Cloudflare Pages clone stayed shallow; omitting lastmod.");
}

function historyStatus() {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { stdio: "ignore" });
  } catch {
    return "not a git checkout";
  }
  try {
    const shallow = execFileSync("git", ["rev-parse", "--is-shallow-repository"], { encoding: "utf8" }).trim();
    if (shallow === "true") {
      return "shallow clone";
    }
    if (shallow !== "false") {
      return `unexpected shallow check: ${shallow}`;
    }
  } catch {
    return "could not tell whether the clone is shallow";
  }
  return null;
}

/** line number (1-based) → committer unix time, or null when that line is uncommitted. */
function blame(file) {
  let out = "";
  try {
    out = execFileSync("git", ["blame", "--line-porcelain", "--", file], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[sitemaps] git blame ${file} failed (${message.split("\n")[0]}). Omitting lastmod for URLs from this file.`);
    return null;
  }
  const dates = new Map();
  let line = null;
  let hash = null;
  let time = null;
  const flush = () => {
    if (line == null) {
      return;
    }
    dates.set(line, hash === ZERO ? null : time);
  };
  for (const raw of out.split("\n")) {
    const header = /^([0-9a-f]{40}) \d+ (\d+)/.exec(raw);
    if (header) {
      flush();
      hash = header[1];
      line = Number(header[2]);
      time = null;
      continue;
    }
    if (raw.startsWith("committer-time ")) {
      time = Number(raw.slice("committer-time ".length));
    }
  }
  flush();
  return dates;
}

function dayFromUnix(seconds) {
  return DAY.format(new Date(seconds * 1000));
}

/** Latest committed date in the inclusive line range, or null if any line is missing or dirty. */
function lastmodOf(dates, start, end) {
  if (!dates) {
    return null;
  }
  let max = 0;
  for (let line = start; line <= end; line += 1) {
    if (!dates.has(line)) {
      return null;
    }
    const value = dates.get(line);
    if (value == null) {
      return null;
    }
    if (value > max) {
      max = value;
    }
  }
  return max === 0 ? null : dayFromUnix(max);
}

function lastmodOfFile(dates) {
  if (!dates || dates.size === 0) {
    return null;
  }
  const lines = [...dates.keys()];
  return lastmodOf(dates, Math.min(...lines), Math.max(...lines));
}

/** The object in `source` that contains `marker`, as 1-based inclusive lines. */
function blockRange(source, marker) {
  const lines = source.split("\n");
  const at = lines.findIndex((line) => line.includes(marker));
  if (at < 0) {
    throw new Error(`sitemap source is missing ${marker}`);
  }
  let start = at;
  while (start > 0 && lines[start] !== "  {") {
    start -= 1;
  }
  if (lines[start] !== "  {") {
    throw new Error(`sitemap source has no block for ${marker}`);
  }
  let end = at;
  while (end < lines.length && lines[end] !== "  }," && lines[end] !== "  }") {
    end += 1;
  }
  if (end >= lines.length) {
    throw new Error(`sitemap source has no end for ${marker}`);
  }
  return [start + 1, end + 1];
}

function drinkLine(text, slug) {
  const lines = text.split("\n");
  const prefix = `${slug},`;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].startsWith(prefix)) {
      return i + 1;
    }
  }
  return null;
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function urlset(entries) {
  const body = entries
    .map((entry) => {
      const lines = ["<url>", `<loc>${escapeXml(entry.loc)}</loc>`];
      if (entry.lastmod) {
        lines.push(`<lastmod>${entry.lastmod}</lastmod>`);
      }
      lines.push("</url>");
      return lines.join("\n");
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function index(locs) {
  const body = locs.map((loc) => `<sitemap>\n<loc>${escapeXml(loc)}</loc>\n</sitemap>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

function publish(path, body) {
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, body);
  renameSync(temp, path);
}

const OUTPUTS = ["public/sitemap.xml", "public/sitemap-pages.xml", "public/sitemap-drinks.xml"];
const SOURCES = [
  "data/drinks.csv",
  "data/still-seasons.json",
  "lib/drinks.ts",
  "lib/scenes.ts",
  "lib/categories.ts",
  "lib/sitemap-entries.ts",
  "lib/tags.ts",
  "data/tags/mutou.csv",
  "app/about/page.tsx",
  "scripts/build-sitemaps.mjs",
];
const lockPath = join(tmpdir(), `sunsup-sitemaps-${createHash("sha1").update(process.cwd()).digest("hex")}.lock`);

function mtime(path) {
  return statSync(path).mtimeMs;
}

function outputsFresh() {
  if (!OUTPUTS.every((path) => existsSync(path)) || !SOURCES.every((path) => existsSync(path))) {
    return false;
  }
  const oldestOutput = Math.min(...OUTPUTS.map(mtime));
  const newestSource = Math.max(...SOURCES.map(mtime));
  return oldestOutput > newestSource;
}

let lockFd = null;

function releaseLock() {
  if (lockFd == null) {
    return;
  }
  closeSync(lockFd);
  lockFd = null;
  try {
    unlinkSync(lockPath);
  } catch {
    // Another waiter's stale-lock cleanup may have removed it.
  }
}

process.on("exit", releaseLock);

function acquireOrSkip() {
  const deadline = Date.now() + 120000;
  for (;;) {
    try {
      lockFd = openSync(lockPath, "wx");
      if (outputsFresh()) {
        releaseLock();
        return false;
      }
      return true;
    } catch (error) {
      if (!error || typeof error !== "object" || !("code" in error) || error.code !== "EEXIST") {
        throw error;
      }
      try {
        if (Date.now() - mtime(lockPath) > 120000) {
          unlinkSync(lockPath);
        }
      } catch {
        // The holder released the lock between the stat and the unlink.
      }
      if (Date.now() > deadline) {
        throw new Error("timed out waiting to write sitemaps");
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    }
  }
}

if (!acquireOrSkip()) {
  process.exit(0);
}

ensurePagesGitHistory();

const pagePaths = sitemapPagePaths();
const drinkPaths = sitemapDrinkPaths();
const overlap = pagePaths.filter((path) => drinkPaths.includes(path));
if (overlap.length > 0 || new Set(pagePaths).size !== pagePaths.length || new Set(drinkPaths).size !== drinkPaths.length) {
  throw new Error(`sitemap paths overlap or repeat: ${overlap.join(", ")}`);
}

const skipped = historyStatus();
const csvText = readFileSync("data/drinks.csv", "utf8");
const scenesText = readFileSync("lib/scenes.ts", "utf8");
const categoriesText = readFileSync("lib/categories.ts", "utf8");
const seasonSlugs = new Set(Object.keys(JSON.parse(readFileSync("data/still-seasons.json", "utf8")).drinks ?? {}));
const dates = skipped
  ? null
  : {
      csv: blame("data/drinks.csv"),
      scenes: blame("lib/scenes.ts"),
      categories: blame("lib/categories.ts"),
      about: blame("app/about/page.tsx"),
      mutou: blame("data/tags/mutou.csv"),
      tag: blame("lib/tags.ts"),
    };

// Pages whose rendered HTML changes with the build clock, or that mix every
// catalog row, have no single accurate date. Drink rows and scene/category
// blocks do: blame those lines only.
const OMIT = new Map([
  ["/", "home seasonal picks follow the build clock"],
  ["/drink/", "the drink index mixes the whole catalog, so neither the page file nor the newest row is the page's last change"],
  ["/ba/office/", "office seasonal picks follow the build clock"],
]);

function pageEntry(path) {
  const loc = `${SITE_ORIGIN}${path}`;
  const omitted = OMIT.get(path);
  if (omitted || !dates) {
    return { loc, lastmod: null, source: omitted ?? skipped };
  }
  if (path === "/about/") {
    return { loc, lastmod: lastmodOfFile(dates.about), source: "app/about/page.tsx" };
  }
  const scene = /^\/ba\/([a-z0-9-]+)\/$/.exec(path);
  if (scene) {
    const range = blockRange(scenesText, `slug: "${scene[1]}"`);
    return {
      loc,
      lastmod: lastmodOf(dates.scenes, range[0], range[1]),
      source: `lib/scenes.ts:${range[0]}-${range[1]}`,
    };
  }
  const category = /^\/category\/([a-z0-9-]+)\/$/.exec(path);
  if (category) {
    const range = blockRange(categoriesText, `id: "${category[1]}"`);
    return {
      loc,
      lastmod: lastmodOf(dates.categories, range[0], range[1]),
      source: `lib/categories.ts:${range[0]}-${range[1]}`,
    };
  }
  if (path === MUTOU.path) {
    const membership = lastmodOfFile(dates.mutou);
    const copy = lastmodOfFile(dates.tag);
    if (!membership || !copy) {
      return { loc, lastmod: null, source: "data/tags/mutou.csv + lib/tags.ts" };
    }
    return {
      loc,
      lastmod: membership > copy ? membership : copy,
      source: "data/tags/mutou.csv + lib/tags.ts",
    };
  }
  return { loc, lastmod: null, source: "no single source file" };
}

function drinkEntry(path) {
  const loc = `${SITE_ORIGIN}${path}`;
  const slug = path.slice("/drink/".length, -1);
  if (!dates) {
    return { loc, lastmod: null, source: skipped };
  }
  if (seasonSlugs.has(slug)) {
    return { loc, lastmod: null, source: "hero still follows the season (data/still-seasons.json)" };
  }
  const line = drinkLine(csvText, slug);
  if (line == null) {
    throw new Error(`public drink ${slug} has no row in data/drinks.csv`);
  }
  return { loc, lastmod: lastmodOf(dates.csv, line, line), source: `data/drinks.csv:${line}` };
}

const pages = pagePaths.map(pageEntry);
const drinks = drinkPaths.map(drinkEntry);
const entries = [...pages, ...drinks];
const withLastmod = entries.filter((entry) => entry.lastmod);

publish("public/sitemap-pages.xml", urlset(pages));
publish("public/sitemap-drinks.xml", urlset(drinks));
publish("public/sitemap.xml", index([`${SITE_ORIGIN}/sitemap-pages.xml`, `${SITE_ORIGIN}/sitemap-drinks.xml`]));

const dated = drinks.filter((entry) => entry.lastmod).sort((a, b) => a.lastmod.localeCompare(b.lastmod) || a.loc.localeCompare(b.loc));
const drinkSamples = [dated[0], dated[Math.floor(dated.length / 2)], dated.at(-1)].filter(Boolean);
const pageSamples = pages.filter((entry) => entry.lastmod);
console.log(
  `[sitemaps] ${pages.length} pages + ${drinks.length} drinks = ${entries.length} urls; lastmod on ${withLastmod.length}; ${skipped ? `omitted all lastmod (${skipped})` : "full git history"}`,
);
for (const entry of [...pageSamples, ...drinkSamples]) {
  console.log(`[sitemaps] ${entry.loc} lastmod ${entry.lastmod} from ${entry.source}`);
}
const omitted = entries.filter((entry) => !entry.lastmod);
if (!skipped && omitted.length > 0 && omitted.length <= 30) {
  for (const entry of omitted) {
    console.log(`[sitemaps] ${entry.loc} no lastmod (${entry.source})`);
  }
}
releaseLock();
