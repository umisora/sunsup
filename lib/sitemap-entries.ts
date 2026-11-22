import { CATEGORY_PAGES, categoryPagePath } from "./categories";
import { loadDrinks, SITE_ORIGIN } from "./drinks";
import { OFFICE_PATH } from "./office-page";
import { SCENES, scenePath } from "./scenes";
import { publishedTags } from "./tags";

export { SITE_ORIGIN };

/** Home, about, the drink index, and /ba/ scene pages. */
export function sitemapScenePaths(): string[] {
  return ["/", OFFICE_PATH, ...SCENES.map(scenePath), "/about/", "/drink/"];
}

/** Category pages and published tag pages. */
export function sitemapCategoryPaths(): string[] {
  return [...CATEGORY_PAGES.map(categoryPagePath), ...publishedTags().map((tag) => tag.path)];
}

/**
 * Trailing-slash paths in the same order as the old single sitemap.
 * /drink/shell/ is an empty template, so it is not listed.
 */
export function sitemapPagePaths(): string[] {
  return [...sitemapScenePaths(), ...sitemapCategoryPaths()];
}

/** Public drink pages, catalog order. */
export function sitemapDrinkPaths(): string[] {
  return loadDrinks().map((drink) => `/drink/${drink.slug}/`);
}
