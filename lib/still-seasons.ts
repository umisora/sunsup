import manifest from "../data/still-seasons.json";
import type { Season } from "./visit";

/**
 * Drinks with seasonal studio stills (data/still-seasons.json). Paths follow one convention:
 * the white cutout stays at the drink's 静物URL, and each season is
 * /drinks/season/<slug>_<spring|summer|autumn|winter>.webp (1200²), with 480w and 800w copies in
 * /drinks/season/480/ and /drinks/season/800/ (scripts/build-drink-thumbs.py).
 */
const SEASON_SLUGS: ReadonlySet<string> = new Set(Object.keys(manifest.drinks));

export const STILL_SEASONS: readonly Season[] = ["spring", "summer", "autumn", "winter"];

export function hasSeasonStills(slug: string): boolean {
  return SEASON_SLUGS.has(slug);
}

export function seasonStillUrl(slug: string, season: Season): string | undefined {
  return hasSeasonStills(slug) ? `/drinks/season/${slug}_${season}.webp` : undefined;
}

/** The 480w / 800w / 1200w srcset of a season still, for a page or card that passes sizes. */
export function seasonStillSrcSet(slug: string, season: Season): string | undefined {
  if (!hasSeasonStills(slug)) {
    return undefined;
  }
  const file = `${slug}_${season}.webp`;
  return `/drinks/season/480/${file} 480w, /drinks/season/800/${file} 800w, /drinks/season/${file} 1200w`;
}

/** Rendered width of the drink page hero still (ProductHero .media). */
export const SEASON_HERO_SIZES = "(max-width: 767px) 100vw, (max-width: 959px) 448px, 576px";

export function seasonStillSlugs(): string[] {
  return [...SEASON_SLUGS];
}
