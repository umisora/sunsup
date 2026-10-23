/**
 * schema.org JSON-LD for drink pages: a Product and its BreadcrumbList.
 * Only facts the catalog row already holds. No price, offer, rating or review is made up,
 * and the brand is left out because the catalog has no brand column.
 */
import { categoryId, drinkDescription, SITE_ORIGIN, type Drink } from "./drinks";
import { volumeMl } from "./servings";

/** "200ml", "1L" or "350g" from the name first, then the size line. Empty when neither says. */
export function volumeOf(drink: Drink): string {
  return volumeMl(drink)?.label ?? "";
}

function absolute(url: string): string {
  return url.startsWith("/") ? `${SITE_ORIGIN}${url}` : url;
}

export function drinkJsonLd(drink: Drink): object[] {
  const url = `${SITE_ORIGIN}/drink/${drink.slug}/`;
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
        ? [{ "@type": "ListItem", position: 3, name: drink.category, item: `${SITE_ORIGIN}/drink/#${shelf}` }]
        : []),
      { "@type": "ListItem", position: shelf ? 4 : 3, name: drink.name, item: url },
    ],
  };
  return [product, breadcrumbs];
}

/** Safe to drop into <script type="application/ld+json">: "<" cannot close the tag. */
export function jsonLdText(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
