import manifest from "../data/still-seasons.json";
import type { Season } from "./visit";

/**
 * Drinks with seasonal studio stills (data/still-seasons.json). Paths follow one convention:
 * the white cutout stays at the drink's 静物URL, and each season is
 * /drinks/season/<slug>_<spring|summer|autumn|winter>.webp.
 */
const SEASON_SLUGS: ReadonlySet<string> = new Set(Object.keys(manifest.drinks));

export const STILL_SEASONS: readonly Season[] = ["spring", "summer", "autumn", "winter"];

export function hasSeasonStills(slug: string): boolean {
  return SEASON_SLUGS.has(slug);
}

export function seasonStillUrl(slug: string, season: Season): string | undefined {
  return hasSeasonStills(slug) ? `/drinks/season/${slug}_${season}.webp` : undefined;
}

export function seasonStillSlugs(): string[] {
  return [...SEASON_SLUGS];
}
