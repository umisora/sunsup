// Fails when two published drinks are the same product: same normalized name,
// same size, and same container. Size is the measured volume (name first, then
// the サイズ line), read the same way as lib/servings.ts volumeMl, so two
// wordings of "330ml" still match. A row with no volume keeps its サイズ text.
// Unpublished rows are ignored for duplicates.
// Also fails when drink copy still has leftover research-memo wording
// (notes about the source page or missing labels) or the typo 合わせましたです.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const VOLUME = /(\d+(?:\.\d+)?)\s*(ml|l|g)(?![a-z])/i;

// Notes about the source page or the research process, left in published copy.
const RESEARCH_MEMO_PATTERNS = [
  "商品ページには",
  "製品ページには",
  "とページにあります",
  "ページに書いて",
  "ページには",
  "表示がありません",
  "表がありません",
  "表が読み取れません",
  "規格欄には",
  "合わせましたです",
];

const COPY_COLUMNS = ["場", "見た目", "サイズ", "味", "品名", "titleName"];

function normalizeName(name) {
  return name.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function normalizeVessel(vessel) {
  return vessel.normalize("NFKC").replace(/\s+/g, " ").trim();
}

/** "330ml", "1000ml" (from 1L), "350g", or the size sentence when no volume is written. */
export function sizeKey(name, size) {
  const fromName = name.normalize("NFKC");
  const fromSize = size.normalize("NFKC");
  const match = VOLUME.exec(fromName) ?? VOLUME.exec(fromSize);
  if (!match) {
    return `text:${fromSize.replace(/\s+/g, " ").trim()}`;
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "l") return `${value * 1000}ml`;
  if (unit === "g") return `${value}g`;
  return `${value}ml`;
}

/**
 * @param {{ slug: string, name: string, size: string, vessel: string, published: boolean }[]} drinks
 * @returns {{ key: string, slugs: string[] }[]}
 */
export function duplicateDrinkGroups(drinks) {
  const groups = new Map();
  for (const drink of drinks) {
    if (!drink.published) continue;
    const key = `${normalizeName(drink.name)}\u0000${sizeKey(drink.name, drink.size)}\u0000${normalizeVessel(drink.vessel)}`;
    const slugs = groups.get(key) ?? [];
    slugs.push(drink.slug);
    groups.set(key, slugs);
  }
  const duplicates = [];
  for (const [key, slugs] of groups) {
    if (slugs.length > 1) duplicates.push({ key, slugs });
  }
  return duplicates;
}

/**
 * @param {{ slug: string, field: string, text: string }[]} entries
 * @returns {{ slug: string, field: string, pattern: string }[]}
 */
export function researchMemoHits(entries) {
  const hits = [];
  for (const entry of entries) {
    for (const pattern of RESEARCH_MEMO_PATTERNS) {
      if (entry.text.includes(pattern)) {
        hits.push({ slug: entry.slug, field: entry.field, pattern });
        break;
      }
    }
  }
  return hits;
}

function selfTest() {
  const pair = duplicateDrinkGroups([
    { slug: "can-a", name: "サンペレグリノ リモナータ", size: "330mlの缶です。", vessel: "缶", published: true },
    { slug: "can-b", name: " サンペレグリノ  リモナータ ", size: "330mlの缶で、手に収まります。", vessel: "缶", published: true },
    { slug: "mini", name: "サンペレグリノ リモナータ 200ml", size: "200mlの小さな缶です。", vessel: "ミニ缶", published: true },
    { slug: "hidden", name: "サンペレグリノ リモナータ", size: "330mlの缶です。", vessel: "缶", published: false },
    { slug: "litre", name: "同じ水", size: "1Lの瓶です。", vessel: "大瓶", published: true },
    { slug: "ml", name: "同じ水", size: "1000mlの瓶です。", vessel: "大瓶", published: true },
    { slug: "pet", name: "同じ水", size: "1000mlのペットボトルです。", vessel: "ペットボトル", published: true },
  ]);
  const keys = pair.map((group) => group.slugs.slice().sort().join(","));
  if (keys.length !== 2 || !keys.includes("can-a,can-b") || !keys.includes("litre,ml")) {
    throw new Error(`self-test: duplicate groups were ${keys.join(" | ")}`);
  }
  if (pair.some((group) => group.slugs.includes("mini") || group.slugs.includes("hidden") || group.slugs.includes("pet"))) {
    throw new Error("self-test: a different size, container, or unpublished row was treated as a duplicate");
  }

  const memos = researchMemoHits([
    { slug: "memo-size", field: "サイズ", text: "瓶です。この商品ページには容量の数字がありません。" },
    { slug: "memo-quote", field: "サイズ", text: "隠し味はレモングラス、とページにあります。" },
    { slug: "memo-written", field: "見た目", text: "ページには、青い瓶で届くこともあると書いてあります。" },
    { slug: "memo-missing", field: "味", text: "この商品ページには原材料の表示がありません。" },
    { slug: "memo-typo", field: "味", text: "無脂肪のミルクと甘さを合わせましたです。" },
    { slug: "ok-other-page", field: "サイズ", text: "通常の190g缶とは別ページの長期保存用です。" },
    { slug: "ok-label", field: "見た目", text: "SPARKLING WATERと書いてあります。" },
    { slug: "ok-official", field: "サイズ", text: "ノンカフェイン、と公式にあります。" },
  ]);
  const memoSlugs = memos.map((hit) => hit.slug).sort().join(",");
  if (memoSlugs !== "memo-missing,memo-quote,memo-size,memo-typo,memo-written") {
    throw new Error(`self-test: research memo hits were ${memoSlugs}`);
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
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }
  return rows;
}

function label(key) {
  const [name, size, vessel] = key.split("\u0000");
  return `${name} / ${size.startsWith("text:") ? size.slice(5) : size} / ${vessel}`;
}

function checkDrinks() {
  selfTest();
  const table = parseCsv(readFileSync(join("data", "drinks.csv"), "utf8"));
  const header = table[0] ?? [];
  const index = Object.fromEntries(header.map((column, columnIndex) => [column.trim(), columnIndex]));
  const required = ["slug", "品名", "サイズ", "容器", "公開", ...COPY_COLUMNS];
  for (const column of required) {
    if (index[column] === undefined) {
      console.error(`drinks.csv is missing ${column}`);
      process.exit(1);
    }
  }
  const cell = (row, column) => (row[index[column]] ?? "").trim();
  const drinks = table.slice(1).map((row) => ({
    slug: cell(row, "slug"),
    name: cell(row, "品名"),
    size: cell(row, "サイズ"),
    vessel: cell(row, "容器"),
    published: cell(row, "公開") === "1",
  }));
  const duplicates = duplicateDrinkGroups(drinks);
  if (duplicates.length > 0) {
    for (const group of duplicates) {
      console.error(`duplicate drink ${group.slugs.join(", ")} share ${label(group.key)}`);
    }
    process.exit(1);
  }

  const entries = [];
  for (const row of table.slice(1)) {
    const slug = cell(row, "slug");
    for (const field of COPY_COLUMNS) {
      entries.push({ slug, field, text: cell(row, field) });
    }
  }
  const memos = researchMemoHits(entries);
  if (memos.length > 0) {
    for (const hit of memos) {
      console.error(`research memo in ${hit.slug} ${hit.field}: ${hit.pattern}`);
    }
    process.exit(1);
  }

  const published = drinks.filter((drink) => drink.published).length;
  console.log(`drink dupes ok: ${published} published drinks, no shared name + size + container, no research memos`);
}

checkDrinks();
