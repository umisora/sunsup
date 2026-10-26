/**
 * STYLISH!'s recommended soft-drink set on a scene page: three roles, each with one drink that can be
 * swapped for another drink of the same role. Bottle counts follow the role, not the drink:
 * 乾杯用 one bottle a person, テーブル用 one big bottle per 4 people, 食事用 one bottle per 2 people.
 * Pure and fs-free, so the browser component, the build and the checks share it.
 */
import type { OutKind } from "./out-links";

export const LIST_SOURCE = "list";
export const DEFAULT_HEADCOUNT = 4;
export const MIN_HEADCOUNT = 1;
export const MAX_HEADCOUNT = 200;

export const SET_ROLES = ["kanpai", "table", "meal"] as const;
export type SetRole = (typeof SET_ROLES)[number];

/** Visible role tag and how many people one bottle covers. */
export const ROLE_INFO: Record<SetRole, { label: string; per: number }> = {
  kanpai: { label: "乾杯用", per: 1 },
  table: { label: "テーブル用", per: 4 },
  meal: { label: "食事用", per: 2 },
};

export type ListStore = { text: string; href: string; kind: OutKind };

export type SetItem = {
  slug: string;
  name: string;
  /** White cutout still, /drinks/<slug>.webp */
  still: string;
  /** e.g. 780ml, shown only when the name does not already carry it */
  size: string;
  stores: readonly ListStore[];
};

/** One role card: the reason holds for every drink in items; items[0] is STYLISH!'s pick. */
export type SetCard = { role: SetRole; reason: string; items: readonly SetItem[] };

export type SetLine = { role: SetRole; item: SetItem; units: number };

export function clampHeadcount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_HEADCOUNT;
  }
  return Math.min(MAX_HEADCOUNT, Math.max(MIN_HEADCOUNT, Math.round(value)));
}

export function roleUnits(role: SetRole, headcount: number): number {
  return Math.ceil(clampHeadcount(headcount) / ROLE_INFO[role].per);
}

/** The chosen drink of each card (picks maps role to slug; a missing or unknown pick falls back to items[0]). */
export function setLines(cards: readonly SetCard[], picks: Partial<Record<SetRole, string>>, headcount: number): SetLine[] {
  return cards
    .filter((card) => card.items.length > 0)
    .map((card) => {
      const item = card.items.find((entry) => entry.slug === picks[card.role]) ?? card.items[0];
      return { role: card.role, item, units: roleUnits(card.role, headcount) };
    });
}

export function setTotal(lines: readonly SetLine[]): number {
  return lines.reduce((sum, line) => sum + line.units, 0);
}

/** The list as plain text, for LINE and the copy button. */
export function setText(title: string, headcount: number, lines: readonly SetLine[], url: string): string {
  return [
    `${title}（${clampHeadcount(headcount)}人分）`,
    ...lines.map((line) => `・${line.item.name}　${line.units}本（${ROLE_INFO[line.role].label}）`),
    `全部で${setTotal(lines)}本`,
    url,
  ].join("\n");
}

export function lineShareUrl(text: string): string {
  return `https://line.me/R/share?text=${encodeURIComponent(text)}`;
}
