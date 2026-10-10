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

/** Shared category stand-in. Not a product photo, so it is not a still. */
const FALLBACK_STILL = /^\/drinks\/fallback-[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/;

const AMAZON_PRODUCT = /^\/(?:dp|gp\/product|gp\/aw\/d)\/[A-Za-z0-9]{10}(?:\/|$)/;

export const SITE_ORIGIN = "https://sunsup-dv4.pages.dev";

export function hasRealStill(drink: Drink): boolean {
  return drink.stillUrl !== "" && !FALLBACK_STILL.test(drink.stillUrl);
}

export function isAmazonProduct(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (host === "amazon.co.jp" || host === "www.amazon.co.jp") && AMAZON_PRODUCT.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function isRakutenProduct(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.toLowerCase() !== "item.rakuten.co.jp") {
      return false;
    }
    return parsed.pathname.split("/").filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}

/** Document title before the site-name template. */
export function drinkTitle(drink: Drink): string {
  return `${drink.name}｜${drink.category}`;
}

/** Unique per drink. Built from the row, not from shared marketing copy. */
export function drinkDescription(drink: Drink): string {
  return `${drink.name}。${drink.category}。${drink.place}`;
}

function stillOrEmpty(value: string, slug: string): string {
  if (!value || FALLBACK_STILL.test(value)) {
    if (value) {
      console.warn(`[drinks] ${slug}: ignore fallback still`);
    }
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

function productOrEmpty(value: string, slug: string, column: "AmazonURL" | "楽天URL"): string {
  const url = httpOrEmpty(value, slug, column);
  if (!url) {
    return "";
  }
  let product = false;
  switch (column) {
    case "AmazonURL":
      product = isAmazonProduct(url);
      break;
    case "楽天URL":
      product = isRakutenProduct(url);
      break;
    default: {
      const exhaustive: never = column;
      return exhaustive;
    }
  }
  if (!product) {
    console.warn(`[drinks] ${slug}: ignore ${column} search`);
    return "";
  }
  return url;
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
      amazonUrl: productOrEmpty(cell(row, "AmazonURL"), slug, "AmazonURL"),
      rakutenUrl: productOrEmpty(cell(row, "楽天URL"), slug, "楽天URL"),
    });
  });

  if (drinks.length === 0) {
    throw new Error("drinks.csv has no publishable rows");
  }

  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const drink of drinks) {
    const title = drinkTitle(drink);
    const description = drinkDescription(drink);
    if (titles.has(title)) {
      throw new Error(`duplicate drink title: ${drink.slug}`);
    }
    if (descriptions.has(description)) {
      throw new Error(`duplicate drink description: ${drink.slug}`);
    }
    titles.add(title);
    descriptions.add(description);
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

/** Canonical label is クラフト・瓶もの. The slash form still groups, so a stray row cannot split the category. */
const CRAFT_BOTTLE_LABELS = new Set(["クラフト・瓶もの", "クラフト／瓶もの"]);

export function categoryKey(category: string): string {
  if (CRAFT_BOTTLE_LABELS.has(category)) {
    return "クラフト・瓶";
  }
  return category;
}

/** One real drink for each category, in the order the office page lists them. */
export const OFFICE_ENTRY_SLUGS = [
  "kimino-yuzu",
  "kuranooto-koshu",
  "fujiya-nectar-peach",
  "suntory-oolong-340",
  "kitayama-jabarush",
  "sanpellegrino-aranciata",
] as const;

export function officeEntries(): Drink[] {
  const entries = OFFICE_ENTRY_SLUGS.map((slug) => {
    const drink = getDrink(slug);
    if (!drink) {
      throw new Error(`office entry missing: ${slug}`);
    }
    return drink;
  });
  const keys = entries.map((drink) => categoryKey(drink.category));
  if (new Set(keys).size !== entries.length) {
    throw new Error("office entries must be one drink per category");
  }
  return entries;
}

/** Absolute still for Open Graph. Only this drink's own still. Never a fallback or another product. */
export function shareImage(drink: Drink): { url: string; alt: string } | undefined {
  if (!hasRealStill(drink)) {
    return undefined;
  }
  const url = drink.stillUrl.startsWith("/") ? `${SITE_ORIGIN}${drink.stillUrl}` : drink.stillUrl;
  return { url, alt: drink.name };
}

const CATEGORY_IDS: Record<string, string> = {
  "柑橘・炭酸": "citrus",
  "ぶどう・ベリー": "grape",
  "果汁・ネクター": "nectar",
  "茶・ハーブ": "tea",
  "クラフト・瓶": "craft",
  "缶・パーティー向き": "party",
};

export type DrinkGroup = {
  id: string;
  category: string;
  drinks: Drink[];
};

function discoveryRank(drink: Drink): number {
  const entry = (OFFICE_ENTRY_SLUGS as readonly string[]).includes(drink.slug);
  if (hasRealStill(drink) && entry) {
    return 0;
  }
  if (hasRealStill(drink)) {
    return 1;
  }
  return 2;
}

/** Categories in office-entry order. Real stills lead each group; rows without a still stay in the list. */
export function drinkGroups(): DrinkGroup[] {
  const drinks = loadDrinks();
  const groups = officeEntries().map((entry) => {
    const key = categoryKey(entry.category);
    const id = CATEGORY_IDS[key];
    if (!id) {
      throw new Error(`no list anchor for ${key}`);
    }
    const members = drinks.filter((drink) => categoryKey(drink.category) === key);
    const ranked = members
      .map((drink, index) => ({ drink, index, rank: discoveryRank(drink) }))
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map((item) => item.drink);
    return { id, category: entry.category, drinks: ranked };
  });
  const listed = groups.reduce((count, group) => count + group.drinks.length, 0);
  if (listed !== drinks.length) {
    throw new Error("drink groups dropped a row");
  }
  return groups;
}

export type CategorySummary = {
  id: string;
  category: string;
  count: number;
};

export function categorySummaries(): CategorySummary[] {
  return drinkGroups().map((group) => ({ id: group.id, category: group.category, count: group.drinks.length }));
}

export function categoryId(drink: Drink): string {
  return CATEGORY_IDS[categoryKey(drink.category)] ?? "";
}

export function relatedDrinks(drink: Drink): Drink[] {
  const group = drinkGroups().find((item) => categoryKey(item.category) === categoryKey(drink.category));
  if (!group) {
    return [];
  }
  return group.drinks.filter((item) => item.slug !== drink.slug);
}

/** Position in the list, 1-based: the drink's number in the collection. */
export function catalogNumber(drink: Drink): number {
  const order = drinkGroups().flatMap((group) => group.drinks);
  return order.findIndex((item) => item.slug === drink.slug) + 1;
}

/** The drinks either side of this one on its shelf, wrapping at the ends. */
export function shelfNeighbours(drink: Drink): { previous: Drink; next: Drink } | undefined {
  const group = drinkGroups().find((item) => categoryKey(item.category) === categoryKey(drink.category));
  if (!group || group.drinks.length < 2) {
    return undefined;
  }
  const at = group.drinks.findIndex((item) => item.slug === drink.slug);
  const size = group.drinks.length;
  const previous = group.drinks[(at - 1 + size) % size];
  const next = group.drinks[(at + 1) % size];
  if (!previous || !next) {
    return undefined;
  }
  return { previous, next };
}

export type Season = "spring" | "summer" | "autumn" | "winter";

type SeasonSpec = { label: string; line: string; keywords: readonly string[]; exclude?: readonly string[] };

const SEASONS: Record<Season, SeasonSpec> = {
  spring: { label: "春の卓", line: "いちご、白桃、さくら。", keywords: ["さくら", "桜", "いちご", "苺", "白桃", "甘夏", "はっさく"] },
  summer: {
    label: "夏の卓",
    line: "レモン、ライム、ラムネ。冷たい炭酸。",
    keywords: ["レモン", "ライム", "ミント", "すいか", "スイカ", "ラムネ", "トニック", "パイン", "マンゴー"],
  },
  autumn: {
    label: "秋の卓",
    line: "ぶどう、梨、りんご、ほうじ茶。",
    keywords: ["ぶどう", "葡萄", "グレープ", "巨峰", "梨", "りんご", "林檎", "アップル", "柿", "ほうじ", "甲州", "シャルドネ"],
    exclude: ["グレープフルーツ", "パイナップル"],
  },
  winter: {
    label: "冬の卓",
    line: "ゆず、みかん、生姜、紅茶。",
    keywords: ["みかん", "蜜柑", "ゆず", "柚子", "YUZU", "生姜", "しょうが", "ジンジャー", "紅茶"],
  },
};

export function seasonOf(date: Date): Season {
  const month = Number(new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone: "Asia/Tokyo" }).format(date));
  if (month >= 3 && month <= 5) {
    return "spring";
  }
  if (month >= 6 && month <= 8) {
    return "summer";
  }
  if (month >= 9 && month <= 11) {
    return "autumn";
  }
  return "winter";
}

/** Drinks whose names carry the season, taken in turn from each shelf so one category cannot fill the table. */
export function seasonalPicks(season: Season, count: number): { label: string; line: string; drinks: Drink[] } {
  const spec = SEASONS[season];
  const shelves = drinkGroups().map((group) =>
    group.drinks.filter(
      (drink) =>
        hasRealStill(drink) &&
        spec.keywords.some((keyword) => drink.name.includes(keyword)) &&
        !(spec.exclude ?? []).some((word) => drink.name.includes(word)),
    ),
  );
  const drinks: Drink[] = [];
  for (let round = 0; drinks.length < count && shelves.some((shelf) => shelf.length > round); round += 1) {
    for (const shelf of shelves) {
      const drink = shelf[round];
      if (drink && drinks.length < count) {
        drinks.push(drink);
      }
    }
  }
  return { label: spec.label, line: spec.line, drinks };
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
