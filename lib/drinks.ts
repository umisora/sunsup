import { readFileSync } from "node:fs";
import { join } from "node:path";

const COLUMNS = [
  "slug",
  "品名",
  "カテゴリ",
  "静物URL",
  "場",
  "見た目",
  "サイズ",
  "味",
  "公式URL",
  "AmazonURL",
  "楽天URL",
] as const;

const REQUIRED = ["品名", "場", "見た目", "サイズ", "味"] as const;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(["shell"]);

export type Drink = {
  slug: string;
  name: string;
  category: string;
  stillUrl: string;
  place: string;
  look: string;
  size: string;
  taste: string;
  officialUrl: string;
  amazonUrl: string;
  rakutenUrl: string;
};

export type StoreRow = {
  label: "公式" | "Amazon" | "楽天";
  href: string;
  text: string;
};

type Column = (typeof COLUMNS)[number];

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
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
      if (char === "\r" && text[i + 1] === "\n") {
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

function isHttp(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** A still shipped with the site at public/drinks/{name}.webp. */
const SITE_STILL = /^\/drinks\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/;

function stillOrEmpty(value: string, slug: string): string {
  if (!value) {
    return "";
  }
  if (isHttp(value) || SITE_STILL.test(value)) {
    return value;
  }
  console.warn(`[drinks] ${slug}: ignore 静物URL`);
  return "";
}

function httpOrEmpty(value: string, slug: string, column: string): string {
  if (!value) {
    return "";
  }
  if (!isHttp(value)) {
    console.warn(`[drinks] ${slug}: ignore ${column}`);
    return "";
  }
  return value;
}

export function parseDrinks(text: string): Drink[] {
  const source = text.replace(/^\uFEFF/, "");
  const table = parseCsv(source);
  const header = table[0];
  if (!header || header.length !== COLUMNS.length || header.some((cell, index) => cell.trim() !== COLUMNS[index])) {
    throw new Error(`drinks.csv header must be ${COLUMNS.join(",")}`);
  }

  const index = new Map<Column, number>(COLUMNS.map((column, columnIndex) => [column, columnIndex]));
  const cell = (row: string[], column: Column) => (row[index.get(column) ?? -1] ?? "").trim();
  const drinks: Drink[] = [];
  const seen = new Set<string>();

  table.slice(1).forEach((row, rowIndex) => {
    const line = rowIndex + 2;
    const slug = cell(row, "slug");
    const missing = REQUIRED.filter((column) => cell(row, column) === "");
    const reasons = [
      !SLUG.test(slug) ? "slug" : "",
      RESERVED_SLUGS.has(slug) ? "reserved" : "",
      seen.has(slug) ? "duplicate" : "",
      ...missing,
    ].filter((reason) => reason !== "");

    if (reasons.length > 0) {
      console.warn(`[drinks] skip line ${line} (${slug || "no slug"}): ${reasons.join(", ")}`);
      return;
    }

    seen.add(slug);
    drinks.push({
      slug,
      name: cell(row, "品名"),
      category: cell(row, "カテゴリ"),
      stillUrl: stillOrEmpty(cell(row, "静物URL"), slug),
      place: cell(row, "場"),
      look: cell(row, "見た目"),
      size: cell(row, "サイズ"),
      taste: cell(row, "味"),
      officialUrl: httpOrEmpty(cell(row, "公式URL"), slug, "公式URL"),
      amazonUrl: httpOrEmpty(cell(row, "AmazonURL"), slug, "AmazonURL"),
      rakutenUrl: httpOrEmpty(cell(row, "楽天URL"), slug, "楽天URL"),
    });
  });

  if (drinks.length === 0) {
    throw new Error("drinks.csv has no publishable rows");
  }

  console.log(`[drinks] ${drinks.length} pages`);
  return drinks;
}

let cache: Drink[] | null = null;

export function loadDrinks(): Drink[] {
  if (cache) {
    return cache;
  }
  const text = readFileSync(join(process.cwd(), "data", "drinks.csv"), "utf8");
  cache = parseDrinks(text);
  return cache;
}

export function getDrink(slug: string): Drink | undefined {
  return loadDrinks().find((drink) => drink.slug === slug);
}

export function storeRows(drink: Drink): StoreRow[] {
  const rows: StoreRow[] = [];
  if (drink.officialUrl) {
    rows.push({ label: "公式", href: drink.officialUrl, text: "公式サイト" });
  }
  if (drink.amazonUrl) {
    rows.push({ label: "Amazon", href: drink.amazonUrl, text: "Amazon" });
  }
  if (drink.rakutenUrl) {
    rows.push({ label: "楽天", href: drink.rakutenUrl, text: "楽天" });
  }
  return rows;
}
