// Fails when two published drinks are the same product: same normalized name,
// same size, and same container. Size is the measured volume (name first, then
// the サイズ line), read the same way as lib/servings.ts volumeMl, so two
// wordings of "330ml" still match. A row with no volume keeps its サイズ text.
// Unpublished rows are ignored.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const VOLUME = /(\d+(?:\.\d+)?)\s*(ml|l|g)(?![a-z])/i;

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
  for (const column of ["slug", "品名", "サイズ", "容器", "公開"]) {
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
  const published = drinks.filter((drink) => drink.published).length;
  console.log(`drink dupes ok: ${published} published drinks, no shared name + size + container`);
}

checkDrinks();
