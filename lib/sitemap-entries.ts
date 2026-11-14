import { CATEGORY_PAGES, categoryPagePath } from "./categories";
import { loadDrinks, SITE_ORIGIN } from "./drinks";
import { SCENES, scenePath } from "./scenes";
import { MUTOU } from "./tags";

export { SITE_ORIGIN };

/**
 * Trailing-slash paths in the same order as the old single sitemap.
 * /drink/shell/ is an empty template, so it is not listed.
 */
export function sitemapPagePaths(): string[] {
  return ["/", "/ba/office/", ...SCENES.map(scenePath), "/about/", "/drink/", ...CATEGORY_PAGES.map(categoryPagePath), MUTOU.path];
}

/** Public drink pages, catalog order. */
export function sitemapDrinkPaths(): string[] {
  return loadDrinks().map((drink) => `/drink/${drink.slug}/`);
}
