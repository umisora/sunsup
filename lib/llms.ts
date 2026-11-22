/**
 * `/llms.txt` for https://llmstxt.org/. Built from the same pages as the
 * sitemaps, without the individual drink URLs. Every title and description is
 * the page's document title (before the layout adds `｜STYLISH!`) and its meta
 * description. The file summary is the homepage meta description.
 */
import { ABOUT_DESCRIPTION, ABOUT_TITLE, HOME_TITLE, SITE_DESCRIPTION, SITE_NAME } from "../design-system/brand";
import { CATEGORY_PAGES, categoryDescription, categoryDrinks, categoryPagePath } from "./categories";
import { DRINK_INDEX_DESCRIPTION, DRINK_INDEX_TITLE, SITE_ORIGIN } from "./drinks";
import { OFFICE_PAGE, OFFICE_PATH } from "./office-page";
import { SCENES, scenePath } from "./scenes";
import { sitemapCategoryPaths, sitemapScenePaths } from "./sitemap-entries";
import { MUTOU, mutouDescription, publishedTags, resolveMutouTag } from "./tags";
import type { PublishedTag } from "./tags";

type LlmsLink = {
  title: string;
  path: string;
  description: string;
};

function entry(title: string, path: string, description: string): LlmsLink {
  if (!path.startsWith("/")) {
    throw new Error(`llms path is not site-relative: ${path}`);
  }
  if (!title || title !== title.trim() || /[\r\n\[\]]/.test(title)) {
    throw new Error(`llms title for ${path} is not a single existing line`);
  }
  if (!description || description !== description.trim() || /[\r\n]/.test(description) || description.includes("{n}")) {
    throw new Error(`llms description for ${path} is not a finished existing line`);
  }
  return { title, path, description };
}

function descriptionForTag(tag: PublishedTag): string {
  if (tag.id === MUTOU.id) {
    return mutouDescription(resolveMutouTag().drinks.length);
  }
  throw new Error(`published tag ${tag.id} has no description on the site to reuse`);
}

function assertSamePages(paths: readonly string[]): void {
  const expected = [...sitemapScenePaths(), ...sitemapCategoryPaths()];
  const missing = expected.filter((path) => !paths.includes(path));
  const extra = paths.filter((path) => !expected.includes(path));
  const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);
  if (missing.length > 0 || extra.length > 0 || duplicates.length > 0) {
    throw new Error(
      `llms.txt drifted from sitemap pages: missing ${missing.join(", ") || "none"}; extra ${extra.join(", ") || "none"}; duplicate ${duplicates.join(", ") || "none"}`,
    );
  }
}

function render(links: readonly LlmsLink[]): string {
  return links.map((item) => `- [${item.title}](${SITE_ORIGIN}${item.path}): ${item.description}`).join("\n");
}

function section(heading: string, links: readonly LlmsLink[]): string[] {
  return [`## ${heading}`, "", render(links)];
}

export function llmsText(): string {
  if (!SITE_DESCRIPTION || SITE_DESCRIPTION !== SITE_DESCRIPTION.trim() || /[\r\n]/.test(SITE_DESCRIPTION)) {
    throw new Error("homepage description is not a one-line llms.txt summary");
  }
  // `/` is the first sitemap scene URL. About and the drink index have their own sections.
  const scenes = [
    entry(HOME_TITLE, "/", SITE_DESCRIPTION),
    entry(OFFICE_PAGE.title, OFFICE_PATH, OFFICE_PAGE.description),
    ...SCENES.map((scene) => entry(scene.metaTitle, scenePath(scene), scene.description)),
  ];
  const categories = [
    entry(DRINK_INDEX_TITLE, "/drink/", DRINK_INDEX_DESCRIPTION),
    ...CATEGORY_PAGES.map((page) =>
      entry(page.title, categoryPagePath(page), categoryDescription(page, categoryDrinks(page).drinks)),
    ),
  ];
  const tags = publishedTags().map((tag) => entry(tag.title, tag.path, descriptionForTag(tag)));
  const about = [entry(ABOUT_TITLE, "/about/", ABOUT_DESCRIPTION)];
  assertSamePages([...scenes, ...categories, ...tags, ...about].map((item) => item.path));

  const parts = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    ...section("Scenes", scenes),
    "",
    ...section("Categories", categories),
  ];
  if (tags.length > 0) {
    parts.push("", ...section("Tags", tags));
  }
  parts.push("", ...section("About", about), "");
  return parts.join("\n");
}
