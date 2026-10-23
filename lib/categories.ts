/**
 * Category pages at /category/<id>/: one page per category of the drink list, with its own title,
 * description and first image. Drinks are grouped by container, from the 容器 column. Sizes and counts
 * are read from the catalog; nothing here is typed in by hand.
 */
import type { PhotoName } from "@/design-system/components/StillLife/photos";
import { CATEGORY_PAGE_IDS, drinkGroups, SITE_ORIGIN, type Drink } from "./drinks";
import { SCENES, sceneDrinks, type Scene } from "./scenes";
import { volumeMl } from "./servings";

export type CategoryPage = {
  id: string;
  /** Page title and the words people search for. */
  title: string;
  titleLines: readonly string[];
  lead: string;
  /** Meta description. {n} is the number of drinks on the page. */
  description: string;
  prose: string;
  /** First image: a row of this category's own drinks, made only from real product stills by scripts/compose-scene-hero.py. */
  hero: PhotoName;
};

export const CATEGORY_PAGES: readonly CategoryPage[] = [
  {
    id: "citrus",
    title: "柑橘・炭酸のノンアルコール",
    titleLines: ["柑橘・炭酸の", "ノンアルコール"],
    lead: "レモンやゆず、みかんの炭酸を中心に、サイダーや炭酸水も集めたページです。",
    description: "レモンやゆず、みかんの炭酸、サイダー、炭酸水の{n}本です。瓶、缶、ペットボトルに分けて並べています。",
    prose:
      "冷やしておけば、乾杯にも、食事のあいだにも出せます。瓶なら一人に一本。缶は人数分を配れて、ペットボトルはふたを閉めれば持ち帰れます。甘いサイダーもあれば、甘さのない炭酸水もあります。",
    hero: "category-citrus",
  },
];

for (const page of CATEGORY_PAGES) {
  if (!CATEGORY_PAGE_IDS.has(page.id)) {
    throw new Error(`category page ${page.id} is missing from CATEGORY_PAGE_IDS`);
  }
}
if (CATEGORY_PAGES.length !== CATEGORY_PAGE_IDS.size) {
  throw new Error("CATEGORY_PAGE_IDS lists a category without a page");
}

export function getCategoryPage(id: string): CategoryPage | undefined {
  return CATEGORY_PAGES.find((page) => page.id === id);
}

export function categoryPagePath(page: CategoryPage): string {
  return `/category/${page.id}/`;
}

/** Drinks of the category in list order (real stills first). */
export function categoryDrinks(page: CategoryPage): { category: string; drinks: Drink[] } {
  const group = drinkGroups().find((item) => item.id === page.id);
  if (!group) {
    throw new Error(`no drinks for category ${page.id}`);
  }
  return { category: group.category, drinks: group.drinks };
}

type Vessel = { id: string; title: string; short: string; noun: string; match: readonly string[] };

const VESSELS: readonly Vessel[] = [
  { id: "bottle", title: "一人に一本ずつ渡せる瓶", short: "瓶", noun: "瓶", match: ["ビン"] },
  { id: "can", title: "人数分を配れる缶", short: "缶", noun: "缶", match: ["缶", "ミニ缶"] },
  { id: "pet", title: "ふたを閉められるペットボトル", short: "ペットボトル", noun: "ペットボトル", match: ["ペットボトル"] },
];
const OTHER: Vessel = { id: "other", title: "紙パックとそのほか", short: "紙パックなど", noun: "紙パックとそのほかの容器", match: [] };

function amount(ml: number): string {
  return ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`;
}

/** "95mlから340mlまでの瓶が36本です。" from the catalog sizes. */
function vesselLine(noun: string, drinks: readonly Drink[]): string {
  const sizes = drinks.map((drink) => volumeMl(drink)?.ml).filter((ml): ml is number => typeof ml === "number");
  const count = `${drinks.length}本です。`;
  if (sizes.length !== drinks.length || sizes.length === 0) {
    return `${noun}が${count}`;
  }
  const low = Math.min(...sizes);
  const high = Math.max(...sizes);
  return low === high ? `${amount(low)}の${noun}が${count}` : `${amount(low)}から${amount(high)}までの${noun}が${count}`;
}

export type VesselGroup = { id: string; title: string; short: string; line: string; drinks: Drink[] };

/** Container groups in the order 瓶, 缶, ペットボトル, then the rest. Every drink lands in exactly one. */
export function vesselGroups(drinks: readonly Drink[]): VesselGroup[] {
  const known = new Set(VESSELS.flatMap((vessel) => vessel.match));
  const groups = [...VESSELS, OTHER].map((vessel) => {
    const members = drinks.filter((drink) => (vessel === OTHER ? !known.has(drink.vessel) : vessel.match.includes(drink.vessel)));
    return { id: vessel.id, title: vessel.title, short: vessel.short, line: vesselLine(vessel.noun, members), drinks: members };
  });
  if (groups.reduce((sum, group) => sum + group.drinks.length, 0) !== drinks.length) {
    throw new Error("vessel groups dropped a drink");
  }
  return groups.filter((group) => group.drinks.length > 0);
}

/** Scenes that list drinks of this category, with how many. */
export function categoryScenes(drinks: readonly Drink[]): { scene: Scene; count: number }[] {
  const slugs = new Set(drinks.map((drink) => drink.slug));
  return SCENES.map((scene) => ({ scene, count: sceneDrinks(scene).filter((drink) => slugs.has(drink.slug)).length })).filter(
    (item) => item.count > 0,
  );
}

export function categoryDescription(page: CategoryPage, drinks: readonly Drink[]): string {
  return page.description.replace("{n}", String(drinks.length));
}

export function categoryJsonLd(page: CategoryPage, drinks: readonly Drink[]): object[] {
  const url = `${SITE_ORIGIN}${categoryPagePath(page)}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${url}#drinks`,
      name: page.title,
      url,
      numberOfItems: drinks.length,
      itemListElement: drinks.map((drink, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: drink.name,
        url: `${SITE_ORIGIN}/drink/${drink.slug}/`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "STYLISH!", item: `${SITE_ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: "ドリンク一覧", item: `${SITE_ORIGIN}/drink/` },
        { "@type": "ListItem", position: 3, name: categoryDrinks(page).category, item: url },
      ],
    },
  ];
}
