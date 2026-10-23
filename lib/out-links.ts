/**
 * Outbound store links and how they are counted.
 * Shared by the drink page (static build), the browser beacon and the Pages Functions,
 * so it must not import anything that touches the file system.
 */

export const OUT_KINDS = ["amazon", "rakuten", "direct", "other", "official"] as const;

export type OutKind = (typeof OUT_KINDS)[number];

/** Store row labels from lib/drinks.ts storeRows(). Kept as a plain map so this file stays fs-free. */
const BY_LABEL: Record<string, OutKind> = {
  Amazon: "amazon",
  楽天: "rakuten",
  公式ショップ: "direct",
  その他の通販: "other",
  公式: "official",
};

export function outKind(label: string): OutKind {
  return BY_LABEL[label] ?? "other";
}

export function isOutKind(value: unknown): value is OutKind {
  return typeof value === "string" && (OUT_KINDS as readonly string[]).includes(value);
}

/** Goal clicks are clicks to a page where the drink can be bought. 公式 (brand site) is counted apart. */
export function isGoalKind(kind: OutKind): boolean {
  return kind !== "official";
}

export type OutLinkMap = {
  slug: string;
  links: Record<string, OutKind>;
};

export function outLinkMap(slug: string, rows: readonly { label: string; href: string }[]): OutLinkMap {
  const links: Record<string, OutKind> = {};
  for (const row of rows) {
    // A brand site that is also the shop (公式URL = 直販URL) counts as the shop, so the click is a goal click.
    const kind = outKind(row.label);
    const known = links[row.href];
    if (!known || (known === "official" && isGoalKind(kind))) {
      links[row.href] = kind;
    }
  }
  return { slug, links };
}

export const OUT_LINKS_ID = "out-links";
