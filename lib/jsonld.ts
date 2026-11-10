/**
 * schema.org JSON-LD. Only facts already on the page: the title, the meta description,
 * the catalog row, and the STYLISH! mark. No price, offer, rating, review, contact or address.
 * The brand is left off Product because the catalog has no brand column.
 */
import { HOME_TITLE, SITE_DESCRIPTION, SITE_NAME } from "../design-system/brand";
import { categoryHref, categoryId, drinkDescription, drinkTitle, SITE_ORIGIN, type Drink } from "./drinks";
import { volumeMl } from "./servings";

export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;

/** Header emblem. The same file the site header already shows. */
const LOGO_URL = `${SITE_ORIGIN}/brand/stylish-mark.svg`;

/** "200ml", "1L" or "350g" from the name first, then the size line. Empty when neither says. */
export function volumeOf(drink: Drink): string {
  return volumeMl(drink)?.label ?? "";
}

function absolute(url: string): string {
  return url.startsWith("/") ? `${SITE_ORIGIN}${url}` : url;
}

function pageUrl(path: string): string {
  return `${SITE_ORIGIN}${path}`;
}

/** Layout title template is `%s｜STYLISH!`; the home title is absolute. */
function documentTitle(title: string, absoluteTitle?: boolean): string {
  return absoluteTitle ? title : `${title}｜${SITE_NAME}`;
}

function pageKind(path: string): "WebPage" | "CollectionPage" {
  if (path === "/drink/" || path.startsWith("/category/") || path.startsWith("/ba/") || path.startsWith("/tag/")) {
    return "CollectionPage";
  }
  return "WebPage";
}

type PageFacts = {
  path: string;
  /** Metadata title, before the layout template. */
  title: string;
  absoluteTitle?: boolean;
  description: string;
  /** @id of the thing this page is about, when the page has one subject. */
  about?: string;
  /** @id of the ItemList a collection page is listing. */
  mainEntity?: string;
};

/** The publisher. Repeated on each page so the graph stands on its own. */
function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    logo: LOGO_URL,
  };
}

function pageJsonLdNode(facts: PageFacts): Record<string, unknown> {
  const url = pageUrl(facts.path);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": pageKind(facts.path),
    "@id": `${url}#webpage`,
    url,
    name: documentTitle(facts.title, facts.absoluteTitle),
    description: facts.description,
    inLanguage: "ja",
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
  };
  if (facts.about) {
    node.about = { "@id": facts.about };
  }
  if (facts.mainEntity) {
    node.mainEntity = { "@id": facts.mainEntity };
  }
  return node;
}

/** Organization plus the page node, for routes whose other JSON-LD is added by the caller. */
export function routeJsonLd(facts: PageFacts): object[] {
  return [organizationJsonLd(), pageJsonLdNode(facts)];
}

export function drinkJsonLd(drink: Drink): object[] {
  const path = `/drink/${drink.slug}/`;
  const url = pageUrl(path);
  const size = volumeOf(drink);
  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: drink.name,
    description: drinkDescription(drink),
    url,
    category: drink.category,
  };
  if (drink.stillUrl) {
    product.image = absolute(drink.stillUrl);
  }
  if (size) {
    product.size = size;
  }
  const shelf = categoryId(drink);
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "STYLISH!", item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "ドリンク一覧", item: `${SITE_ORIGIN}/drink/` },
      ...(shelf
        ? [{ "@type": "ListItem", position: 3, name: drink.category, item: `${SITE_ORIGIN}${categoryHref(shelf)}` }]
        : []),
      { "@type": "ListItem", position: shelf ? 4 : 3, name: drink.name, item: url },
    ],
  };
  return [
    ...routeJsonLd({
      path,
      title: drinkTitle(drink),
      description: drinkDescription(drink),
      about: `${url}#product`,
    }),
    product,
    breadcrumbs,
  ];
}

/** Home page: Organization, the WebSite other pages point at, and the home WebPage. */
export function siteJsonLd(): object[] {
  return [
    organizationJsonLd(),
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
      inLanguage: "ja",
      description: SITE_DESCRIPTION,
      publisher: { "@id": ORGANIZATION_ID },
    },
    pageJsonLdNode({
      path: "/",
      title: HOME_TITLE,
      absoluteTitle: true,
      description: SITE_DESCRIPTION,
      about: ORGANIZATION_ID,
    }),
  ];
}

/**
 * ItemList of drinks already shown on a collection page, in that page's order.
 * Scene, category, tag and office pages share this node. A drink listed twice keeps
 * only its first occurrence; positions are renumbered 1..N.
 */
export function drinkItemList(path: string, name: string, drinks: readonly Drink[]): Record<string, unknown> {
  const url = pageUrl(path);
  const unique: Drink[] = [];
  const seen = new Set<string>();
  for (const drink of drinks) {
    if (seen.has(drink.slug)) continue;
    seen.add(drink.slug);
    unique.push(drink);
  }
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${url}#drinks`,
    name,
    url,
    numberOfItems: unique.length,
    itemListElement: unique.map((drink, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: drink.name,
      url: `${SITE_ORIGIN}/drink/${drink.slug}/`,
    })),
  };
}

/** A top-level page: publisher, the page node, and STYLISH! › the page. `name` is the metadata title. */
export function pageJsonLd(path: string, name: string, description = SITE_DESCRIPTION, mainEntity?: string): object[] {
  return [
    ...routeJsonLd({
      path,
      title: name,
      description,
      about: path === "/about/" ? ORGANIZATION_ID : undefined,
      mainEntity,
    }),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/` },
        { "@type": "ListItem", position: 2, name, item: pageUrl(path) },
      ],
    },
  ];
}

/** Safe to drop into <script type="application/ld+json">: "<" cannot close the tag. */
export function jsonLdText(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
