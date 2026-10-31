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
  {
    id: "grape",
    title: "ぶどう・ベリーのノンアルコール",
    titleLines: ["ぶどう・ベリーの", "ノンアルコール"],
    lead: "ぶどうやマスカット、いちご、ベリーの飲みものを中心に、野菜ジュースやラムネも集めたページです。",
    description: "ぶどう、マスカット、いちご、ベリーの飲みもの、野菜ジュース、ラムネなどの{n}本です。容器ごとに分けて並べています。",
    prose:
      "注ぐと、色がよく見えます。小さな紙パックやカップは一人分なので、人数に合わせて数をそろえれば、配るだけで準備が終わります。味は、果汁の濃いジュースから軽い炭酸まで。",
    hero: "category-grape",
  },
  {
    id: "nectar",
    title: "果汁・ネクターのノンアルコール",
    titleLines: ["果汁・ネクターの", "ノンアルコール"],
    lead: "りんご、みかん、オレンジの果汁を中心に、トマトや野菜のジュース、桃やマンゴーのネクターも集めたページです。",
    description: "りんご、みかん、オレンジの果汁、トマトや野菜のジュース、桃やマンゴーのネクターなどの{n}本です。容器ごとに分けて並べています。",
    prose:
      "甘いものが欲しい人の前に置ける種類です。大きな瓶は注いで分けます。小さな缶や紙パックなら一人に一本ずつ渡せるので、席の数だけ並べておけば足ります。とろりとしたネクターも、さらっとした果汁もあります。",
    hero: "category-nectar",
  },
  {
    id: "tea",
    title: "茶・ハーブのノンアルコール",
    titleLines: ["茶・ハーブの", "ノンアルコール"],
    lead: "ほうじ茶、紅茶、緑茶、抹茶、麦茶を中心に、ジャスミン茶や烏龍茶、ミルクティーやラテも集めたページです。",
    description: "ほうじ茶、紅茶、緑茶、抹茶、麦茶、ジャスミン茶、烏龍茶、ミルクティーやラテなどの{n}本です。容器ごとに分けて並べています。",
    prose:
      "食事の席に、いちばん合わせやすい種類です。ペットボトルなら人数分を並べておくだけで済みますし、大きな瓶なら注いで分けられます。甘さは一本ごとに違います。甘くないお茶もあれば、ミルクティーやラテのように甘いものもあります。",
    hero: "category-tea",
  },
  {
    id: "craft",
    title: "クラフト・瓶もののノンアルコール",
    titleLines: ["クラフト・瓶ものの", "ノンアルコール"],
    lead: "土地のサイダーやラムネ、クラフトコーラを中心に、割って飲むシロップや甘酒も集めたページです。",
    description: "土地のサイダーやラムネ、クラフトコーラ、割って飲むシロップ、甘酒などの{n}本です。容器ごとに分けて並べています。",
    prose:
      "ラベルや土地の名前が目に入るので、持っていくと話のきっかけになります。小さな瓶は一人に一本。大きな瓶とシロップは、注いで分けます。シロップは水や炭酸で割って飲みます。サイダーの甘さから、コーラのスパイスまで、味はさまざまです。",
    hero: "category-craft",
  },
  {
    id: "party",
    title: "缶・パーティー向きのノンアルコール",
    titleLines: ["缶・パーティー", "向きの", "ノンアルコール"],
    lead: "缶や大きな容器のコーヒーを中心に、コーラやサイダー、野菜ジュースも集めたページです。",
    description: "缶や大きな容器のコーヒー、コーラ、サイダー、野菜ジュースなどの{n}本です。容器ごとに分けて並べています。",
    prose:
      "人数の多い会で、まとめて用意しやすい種類です。缶は冷やして配るだけ。1Lの紙パックやペットボトルは、グラスに注いで何人かで分けます。コーヒーは、無糖から甘いものまであります。",
    hero: "category-party",
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
  { id: "bottle", title: "そのまま手渡せる瓶", short: "瓶", noun: "瓶", match: ["ビン"] },
  { id: "big", title: "注いで分ける大きな瓶", short: "大きな瓶", noun: "大きな瓶", match: ["大瓶"] },
  { id: "can", title: "人数分を配れる缶", short: "缶", noun: "缶", match: ["缶", "ミニ缶", "ボトル缶"] },
  { id: "pet", title: "ふたを閉められるペットボトル", short: "ペットボトル", noun: "ペットボトル", match: ["ペットボトル"] },
  { id: "carton", title: "紙パック", short: "紙パック", noun: "紙パック", match: ["紙パック"] },
];
/** A container with fewer drinks than this joins the last group, so no group is one or two cards. */
const MIN_GROUP = 4;

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

/**
 * Container groups in the order 瓶, 大きな瓶, 缶, ペットボトル, 紙パック, then the rest.
 * Every drink lands in exactly one. Small groups fold into the last one.
 */
export function vesselGroups(drinks: readonly Drink[]): VesselGroup[] {
  const known = new Set(VESSELS.flatMap((vessel) => vessel.match));
  const rest: Drink[] = drinks.filter((drink) => !known.has(drink.vessel));
  const restKinds = new Set<string>();
  if (rest.length > 0) {
    restKinds.add("other");
  }
  const groups: VesselGroup[] = [];
  for (const vessel of VESSELS) {
    const members = drinks.filter((drink) => vessel.match.includes(drink.vessel));
    if (members.length >= MIN_GROUP) {
      groups.push({ id: vessel.id, title: vessel.title, short: vessel.short, line: vesselLine(vessel.noun, members), drinks: members });
    } else if (members.length > 0) {
      rest.push(...members);
      restKinds.add(vessel.id);
    }
  }
  if (rest.length > 0) {
    const order = new Map(drinks.map((drink, index) => [drink.slug, index]));
    rest.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
    const carton = restKinds.has("carton");
    const title = carton ? "紙パックとそのほか" : "そのほかの容器";
    const noun = carton ? "紙パックとそのほかの容器" : "そのほかの容器";
    groups.push({ id: "other", title, short: carton ? "紙パックなど" : "そのほか", line: vesselLine(noun, rest), drinks: rest });
  }
  if (groups.reduce((sum, group) => sum + group.drinks.length, 0) !== drinks.length) {
    throw new Error("vessel groups dropped a drink");
  }
  return groups;
}

/** Scenes that list drinks of this category, with how many. */
export function categoryScenes(drinks: readonly Drink[]): { scene: Scene; count: number }[] {
  const slugs = new Set(drinks.map((drink) => drink.slug));
  return SCENES.map((scene) => ({ scene, count: sceneDrinks(scene).filter((drink) => slugs.has(drink.slug)).length }))
    .filter((item) => item.count > 0)
    .sort((a, b) => (a.scene.slug === "bonenkai" ? -1 : b.scene.slug === "bonenkai" ? 1 : 0));
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
