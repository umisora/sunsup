/**
 * Cross-category tag pages. Membership is data/tags/<id>.csv, not a column on
 * data/drinks.csv, so the catalog can change without this list. A slug that is
 * missing or not public is skipped and reported. Nothing is substituted.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { vesselGroups } from "./categories";
import { getDrink, parseCsv, SITE_ORIGIN, type Drink } from "./drinks";
import { drinkItemList, routeJsonLd } from "./jsonld";

const TAG_FILE = "data/tags/mutou.csv";

export const MUTOU = {
  id: "mutou",
  path: "/tag/mutou/",
  title: "無糖のドリンク",
  titleLines: ["無糖の", "ドリンク"],
  lead: "飲み会の数日前に、甘くない一本を見た目で選ぶ棚です。",
  /** Meta description. {n} is the number of drinks actually listed. */
  description:
    "甘いサイダーの隣に、無糖を置く。お茶、炭酸水、ブラックコーヒーの{n}本です。テーブルに似合う一本を見た目で選んで、Amazonや楽天のページからそのまま頼めます。",
} as const;

export type TagSkipReason = "missing" | "unpublished";

export type TagSkip = {
  slug: string;
  reason: TagSkipReason;
};

export type ResolvedTag = {
  drinks: Drink[];
  skipped: TagSkip[];
};

export function mutouDescription(count: number): string {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`mutou count is not a whole number: ${count}`);
  }
  if (!MUTOU.description.includes("{n}")) {
    throw new Error("mutou description must include {n}");
  }
  const text = MUTOU.description.replaceAll("{n}", String(count));
  if (text.includes("{n}") || !text.includes(`${count}本`)) {
    throw new Error("mutou description did not take the drink count");
  }
  return text;
}

export function loadMutouSlugs(): string[] {
  const text = readFileSync(join(process.cwd(), TAG_FILE), "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(text);
  const header = (rows[0] ?? []).map((cell) => cell.trim());
  if (header.length !== 1 || header[0] !== "slug") {
    throw new Error(`${TAG_FILE} header must be slug`);
  }
  const slugs = rows.slice(1).map((row) => (row[0] ?? "").trim());
  if (slugs.some((slug) => slug === "")) {
    throw new Error(`${TAG_FILE} has an empty slug`);
  }
  const seen = new Set<string>();
  for (const slug of slugs) {
    if (seen.has(slug)) {
      throw new Error(`${TAG_FILE} lists ${slug} twice`);
    }
    seen.add(slug);
  }
  return slugs;
}

function catalogPublication(): Map<string, string> {
  const text = readFileSync(join(process.cwd(), "data", "drinks.csv"), "utf8").replace(/^\uFEFF/, "");
  const table = parseCsv(text);
  const header = (table[0] ?? []).map((cell) => cell.trim());
  const slugAt = header.indexOf("slug");
  const publishedAt = header.indexOf("公開");
  if (slugAt < 0 || publishedAt < 0) {
    throw new Error("drinks.csv is missing slug or 公開");
  }
  const publication = new Map<string, string>();
  for (const row of table.slice(1)) {
    const slug = (row[slugAt] ?? "").trim();
    if (slug) {
      publication.set(slug, (row[publishedAt] ?? "").trim());
    }
  }
  return publication;
}

function skipReason(slug: string, publication: ReadonlyMap<string, string>): TagSkipReason | undefined {
  const published = publication.get(slug);
  if (published === undefined) {
    return "missing";
  }
  if (published !== "1") {
    return "unpublished";
  }
  return undefined;
}

let resolved: ResolvedTag | null = null;

/** Published drinks in file order. Missing and unpublished slugs are skipped. */
export function resolveMutouTag(): ResolvedTag {
  if (resolved) {
    return resolved;
  }
  const publication = catalogPublication();
  const drinks: Drink[] = [];
  const skipped: TagSkip[] = [];
  for (const slug of loadMutouSlugs()) {
    const reason = skipReason(slug, publication);
    const drink = reason ? undefined : getDrink(slug);
    if (reason || !drink) {
      const skip: TagSkip = { slug, reason: reason ?? "missing" };
      skipped.push(skip);
      console.warn(`[tags] skip ${skip.slug}: ${skip.reason}`);
      continue;
    }
    drinks.push(drink);
  }
  console.log(`[tags] mutou: ${drinks.length} published drinks${skipped.length > 0 ? `, skipped ${skipped.length}` : ""}`);
  resolved = { drinks, skipped };
  return resolved;
}

/**
 * Order of drink links on the page: vessel groups, then drinks with a still
 * before drinks without one, matching DrinkShelf.
 */
export function mutouListed(drinks: readonly Drink[]): Drink[] {
  const listed = vesselGroups(drinks).flatMap((group) => {
    const pictured = group.drinks.filter((drink) => drink.stillUrl !== "");
    const plain = group.drinks.filter((drink) => drink.stillUrl === "");
    return [...pictured, ...plain];
  });
  if (listed.length !== drinks.length) {
    throw new Error("mutou list dropped a drink");
  }
  return listed;
}

export function mutouJsonLd(drinks: readonly Drink[]): object[] {
  const path = MUTOU.path;
  const url = `${SITE_ORIGIN}${path}`;
  return [
    ...routeJsonLd({
      path,
      title: MUTOU.title,
      description: mutouDescription(drinks.length),
      mainEntity: `${url}#drinks`,
    }),
    drinkItemList(path, MUTOU.title, mutouListed(drinks)),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "STYLISH!", item: `${SITE_ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: "ドリンク一覧", item: `${SITE_ORIGIN}/drink/` },
        { "@type": "ListItem", position: 3, name: MUTOU.title, item: url },
      ],
    },
  ];
}
