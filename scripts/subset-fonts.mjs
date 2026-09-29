import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const SOURCE_DIRS = ["app", "components"];
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
  const files = (await Promise.all(SOURCE_DIRS.map(sourceFiles))).flat();
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

async function download(font, text) {
  const family = encodeURIComponent(font.family).replaceAll("%20", "+");
  const url = `https://fonts.googleapis.com/css2?family=${family}:${font.axis}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url, { headers: { "User-Agent": USER_AGENT } })).text();
  const match = css.match(/url\((https:[^)]+)\)\s*format\('woff2'\)/);
  if (!match) {
    throw new Error(`No woff2 for ${font.family} ${font.axis}:\n${css}`);
  }
  const bytes = Buffer.from(await (await fetch(match[1])).arrayBuffer());
  await writeFile(join("fonts", font.file), bytes);
  console.log(`${font.file} ${bytes.length} bytes`);
}

const site = await siteText();
for (const font of FONTS) {
  await download(font, font.text === "latin" ? LATIN : site);
}
