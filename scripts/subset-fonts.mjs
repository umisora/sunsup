import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

const SOURCE_DIRS = ["app", "design-system"];
const EXTRA_FILES = ["data/drinks.csv"];
const LATIN =
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const FONTS = [
  { file: "cormorant-garamond-500.woff2", family: "Cormorant Garamond", axis: "wght@500", text: "latin" },
  { file: "cormorant-garamond-500-italic.woff2", family: "Cormorant Garamond", axis: "ital,wght@1,500", text: "latin" },
  { file: "shippori-mincho-500.woff2", family: "Shippori Mincho", axis: "wght@500", text: "site" },
  { file: "zen-kaku-gothic-new-400.woff2", family: "Zen Kaku Gothic New", axis: "wght@400", text: "site" },
  { file: "zen-kaku-gothic-new-500.woff2", family: "Zen Kaku Gothic New", axis: "wght@500", text: "site" },
];

async function sourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return sourceFiles(path);
      }
      return extname(path) === ".tsx" ? [path] : [];
    }),
  );
  return nested.flat();
}

async function siteText() {
  const files = [...(await Promise.all(SOURCE_DIRS.map(sourceFiles))).flat(), ...EXTRA_FILES];
  const chars = new Set(LATIN);
  for (const file of files) {
    for (const char of await readFile(file, "utf8")) {
      if (char.codePointAt(0) > 0x7f) {
        chars.add(char);
      }
    }
  }
  return [...chars].sort().join("");
}

function mergeWoff2(buffers) {
  const dir = mkdtempSync(join(tmpdir(), "sunsup-fonts-"));
  try {
    const paths = buffers.map((buffer, index) => {
      const path = join(dir, `${index}.woff2`);
      writeFileSync(path, buffer);
      return path;
    });
    const out = join(dir, "merged.woff2");
    const script = [
      "from fontTools.merge import Merger",
      `font = Merger().merge([${paths.map((path) => JSON.stringify(path)).join(", ")}])`,
      "font.flavor = 'woff2'",
      `font.save(${JSON.stringify(out)})`,
    ].join("\n");
    const result = spawnSync("python3", ["-c", script], { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(result.stderr || "fontTools merge failed");
    }
    return readFileSync(out);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Google drops `text` once the URL is too long and returns unicode-range slices. Split until each request is one subset, then merge. */
async function subset(font, text) {
  const family = encodeURIComponent(font.family).replaceAll("%20", "+");
  const url = `https://fonts.googleapis.com/css2?family=${family}:${font.axis}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url, { headers: { "User-Agent": USER_AGENT } })).text();
  const urls = [...css.matchAll(/url\((https:[^)]+)\)\s*format\('woff2'\)/g)].map((match) => match[1]);
  if (urls.length === 1) {
    return Buffer.from(await (await fetch(urls[0])).arrayBuffer());
  }
  const chars = [...text];
  if (urls.length === 0 || chars.length < 2) {
    throw new Error(`No single woff2 for ${font.family} ${font.axis}:\n${css.slice(0, 500)}`);
  }
  const mid = Math.ceil(chars.length / 2);
  const left = await subset(font, chars.slice(0, mid).join(""));
  const right = await subset(font, chars.slice(mid).join(""));
  return mergeWoff2([left, right]);
}

async function download(font, text) {
  const bytes = await subset(font, text);
  await writeFile(join("fonts", font.file), bytes);
  console.log(`${font.file} ${bytes.length} bytes`);
}

const site = await siteText();
for (const font of FONTS) {
  await download(font, font.text === "latin" ? LATIN : site);
}
