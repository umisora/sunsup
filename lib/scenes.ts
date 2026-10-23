/**
 * Scene landing pages under /ba/<slug>/. Each scene picks drinks by hand in three groups,
 * in the site's order: how it looks on the table, then size, then taste.
 * Only public drinks with a real product still may be listed (checked in scripts/check-scenes.mjs).
 */
import { getDrink, hasRealStill, SITE_ORIGIN, type Drink } from "./drinks";

export type SceneGroup = {
  id: string;
  title: string;
  line: string;
  slugs: readonly string[];
};

export type Scene = {
  slug: string;
  /** Page title and the words people search for. */
  title: string;
  /** Short name for links and breadcrumbs. */
  short: string;
  description: string;
  lead: string;
  prose: string;
  criteria: readonly { no: string; title: string; lines: readonly string[] }[];
  groups: readonly SceneGroup[];
  /** One line for the card that links back here from drink pages. */
  backLink: string;
};

export const SCENES: readonly Scene[] = [
  {
    slug: "bonenkai",
    title: "忘年会・新年会のノンアルコール",
    short: "忘年会・新年会",
    description:
      "会社の忘年会や新年会で、お酒を飲まない人にも配れるノンアルコール飲料を選べます。テーブルに置く大きな瓶、ひとりに一本ずつ渡す小さな瓶、甘くない一本に分けて紹介しています。",
    lead: "年末と年始の飲み会を任されたあなたが、お酒を飲まない人のぶんを選ぶページです。",
    prose:
      "12月の忘年会と1月の新年会は、ふだんの飲み会より人が多く、乾杯から始まります。お酒を飲まない人も、車で来た人も、翌朝が早い人も、同じタイミングでグラスを上げられるように、テーブルで見栄えのする瓶を用意しておくと安心です。お店に持ち込むときは、先にお店へ確認しておきましょう。",
    criteria: [
      {
        no: "01",
        title: "見た目",
        lines: ["乾杯のときに手に持つので、ラベルのきれいな瓶がおすすめです。", "テーブルの真ん中に大きな瓶を一本置くと、それだけで華やかになります。"],
      },
      {
        no: "02",
        title: "サイズ",
        lines: ["720〜780mlの大きな瓶なら、3〜4人で分けられます。", "ひとりで飲む人には、200〜280mlの小さな瓶を一本ずつ渡します。"],
      },
      {
        no: "03",
        title: "味",
        lines: ["甘い果汁だけだと、料理と合わせにくくなります。", "ぴりっと辛いジンジャーエールや甘さ控えめのサイダーを混ぜておくと、最後まで飲めます。"],
      },
    ],
    groups: [
      {
        id: "table",
        title: "テーブルに置く大きな瓶",
        line: "乾杯の前に、テーブルの真ん中へ。グラスに注いで分けます。",
        slugs: ["pom-mikan-straight-780", "nfs-apple-720", "knk-kanjuku-apple-720", "ringowork-original-720"],
      },
      {
        id: "single",
        title: "ひとりに一本ずつ",
        line: "乾杯のときに、そのまま手に持てる小さな瓶です。",
        slugs: ["kimino-yuzu", "kimino-ringo", "shinshu-apple-cider-245", "kimura-fuji-yuzu"],
      },
      {
        id: "dry",
        title: "甘くない一本",
        line: "料理と一緒に飲みたい人のために、辛いものや甘さ控えめのものを混ぜます。",
        slugs: ["kimura-wasabi-ginger", "neo-ginger-200", "kitayama-jabarush", "umaji-yuzu-cider-280"],
      },
    ],
    backLink: "年末と年始の飲み会で配れる瓶を、大きな瓶、小さな瓶、甘くない一本に分けています。",
  },
];

export function getScene(slug: string): Scene | undefined {
  return SCENES.find((scene) => scene.slug === slug);
}

/** The drinks of a group that are public and have a real still, in the order written. */
export function groupDrinks(group: SceneGroup): Drink[] {
  return group.slugs
    .map((slug) => getDrink(slug))
    .filter((drink): drink is Drink => Boolean(drink && hasRealStill(drink)));
}

export function sceneDrinks(scene: Scene): Drink[] {
  return scene.groups.flatMap((group) => groupDrinks(group));
}

/** Scenes that list this drink, for the card back from the drink page. */
export function scenesFor(slug: string): Scene[] {
  return SCENES.filter((scene) => scene.groups.some((group) => group.slugs.includes(slug)));
}

export function scenePath(scene: Scene): string {
  return `/ba/${scene.slug}/`;
}

export function sceneJsonLd(scene: Scene): object[] {
  const url = `${SITE_ORIGIN}${scenePath(scene)}`;
  const drinks = sceneDrinks(scene);
  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${url}#drinks`,
      name: scene.title,
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
        { "@type": "ListItem", position: 2, name: scene.title, item: url },
      ],
    },
  ];
}
