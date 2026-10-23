/**
 * The organiser's shopping list on a scene page: how many of each picked drink to buy for a headcount.
 * Pure and fs-free, so the browser component, the build and the checks share it.
 * People per bottle come from lib/servings.ts servingUnit(): the catalog's own count, otherwise
 * 180ml a person, a personal container is one person's, and a syrup with no count is one bottle.
 */
import type { OutKind } from "./out-links";

export const LIST_SOURCE = "list";
export const DEFAULT_HEADCOUNT = 10;
export const MIN_HEADCOUNT = 1;
export const MAX_HEADCOUNT = 200;

export type ListStore = { text: string; href: string; kind: OutKind };

export type ListItem = {
  slug: string;
  name: string;
  /** People one bottle serves; 0 for a syrup with no count. */
  people: number;
  dilute: boolean;
  /** e.g. ひとり分, 約4人分, 割って飲む (kept for the share text and checks; not shown on the row) */
  servingText: string;
  /** White cutout still, /drinks/<slug>.webp */
  still: string;
  /** e.g. 780ml, shown only when the name does not already carry it */
  size: string;
  stores: readonly ListStore[];
};

export type ListLine = { item: ListItem; people: number; units: number };

export function clampHeadcount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_HEADCOUNT;
  }
  return Math.min(MAX_HEADCOUNT, Math.max(MIN_HEADCOUNT, Math.round(value)));
}

/** Bottles to buy for this many people. A syrup with no count is one bottle to start with. */
export function unitsFor(people: number, perUnit: number): number {
  if (perUnit <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(people / perUnit));
}

/** Splits the headcount over the picked drinks, the first ones taking the remainder (10 over 3 is 4, 3, 3). */
export function listLines(items: readonly ListItem[], headcount: number): ListLine[] {
  const count = clampHeadcount(headcount);
  if (items.length === 0) {
    return [];
  }
  const base = Math.floor(count / items.length);
  const extra = count % items.length;
  return items
    .map((item, index) => ({ item, people: base + (index < extra ? 1 : 0) }))
    .filter((line) => line.people > 0)
    .map((line) => ({ ...line, units: unitsFor(line.people, line.item.people) }));
}

export function listTotal(lines: readonly ListLine[]): number {
  return lines.reduce((sum, line) => sum + line.units, 0);
}

/** The heading: 「10人なら、7本。」 */
export function keyMessage(headcount: number, lines: readonly ListLine[]): string {
  return `${clampHeadcount(headcount)}人分で${listTotal(lines)}本`;
}

/** The list as plain text, for LINE and the copy button. */
export function listText(title: string, headcount: number, lines: readonly ListLine[], url: string): string {
  return [
    `${title}（${clampHeadcount(headcount)}人分）`,
    ...lines.map((line) => `・${line.item.name}　${line.units}本`),
    `合計${listTotal(lines)}本`,
    url,
  ].join("\n");
}

export function lineShareUrl(text: string): string {
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}
