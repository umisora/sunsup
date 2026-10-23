/**
 * Scene landing pages under /ba/<slug>/. Each scene picks drinks by hand in three groups,
 * in the site's order: how it looks on the table, then size, then taste.
 * Only public drinks with a real product still may be listed (checked in scripts/check-scenes.mjs).
 */
import { isDemoted } from "./demote";
import { getDrink, hasRealStill, SITE_ORIGIN, type Drink } from "./drinks";
import type { PhotoName } from "@/design-system/components/StillLife/photos";


export type SceneGroup = {
  id: string;
  title: string;
  line: string;
  slugs: readonly string[];
};

export type Scene = {
  slug: string;
  /** Small label over the title, and the step name for the prose block. */
  eyebrow: string;
  proseLabel: string;
  /** Page title and the words people search for. */
  title: string;
  /** Where the big title breaks, when breaking after the last の does not read well. */
  titleLines?: readonly string[];
  /** Short name for links and breadcrumbs. */
  short: string;
  description: string;
  lead: string;
  prose: string;
  criteria: readonly { no: string; title: string; lines: readonly string[] }[];
  groups: readonly SceneGroup[];
  /** One line for the card that links back here from drink pages. */
  backLink: string;
  /** The closing panel: one short note and a two-line headline. */
  invite: { note: string; headline: readonly [string, string] };
  /** First image: a row of this page's own drinks, made only from real product stills by scripts/compose-scene-hero.py. */
  hero: PhotoName;
};

export const SCENES: readonly Scene[] = [
  {
    slug: "bonenkai",
    hero: "scene-bonenkai",
    eyebrow: "飲み会",
    proseLabel: "この飲み会",
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
        lines: ["甘い果汁だけだと、料理と合わせにくくなります。", "すっきりしたジンジャーエールや甘さ控えめの炭酸を混ぜておくと、最後まで飲めます。"],
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
        line: "料理と一緒に飲みたい人のために、甘さ控えめのものを混ぜます。",
        slugs: ["kimura-wasabi-ginger", "maison-perrier-raspberry-330", "hyuganatsu-cider-245", "umaji-yuzu-cider-280"],
      },
    ],
    backLink: "年末と年始の飲み会で配れる瓶を、大きな瓶、小さな瓶、甘くない一本に分けています。",
    invite: { note: "人数と、お酒を飲まない人の数がわかったら、本数を決めます。", headline: ["大きな瓶を一本と、", "小さな瓶を人数分。"] },
  },
  {
    slug: "kaisha",
    hero: "scene-kaisha",
    eyebrow: "飲み会",
    proseLabel: "この飲み会",
    title: "会社の飲み会のノンアルコール",
    short: "会社の飲み会",
    description:
      "会社の飲み会で、お酒を飲まない人が手に取りやすいノンアルコール飲料を選べます。乾杯で手に持つ瓶、ひとりで飲みきれる小さな缶、食事に合う甘くない一本に分けて紹介しています。",
    lead: "ふだんの会社の飲み会で、お酒を飲まない人のぶんを用意するページです。",
    prose:
      "会社の飲み会は、乾杯のあとに食事と話が続きます。お酒を飲まない人も、乾杯で同じように瓶を持てて、食事のあいだも手元に飲みものがあれば、気をつかわずにいられます。社内で開くなら人数分を買っておけます。お店で開くときは、持ち込めるかどうかを先に確かめておきましょう。",
    criteria: [
      {
        no: "01",
        title: "見た目",
        lines: ["乾杯で手に持つので、ラベルがはっきりした瓶がおすすめです。", "果物の色が見える瓶なら、何の飲みものかすぐにわかります。"],
      },
      {
        no: "02",
        title: "サイズ",
        lines: ["240〜250mlの瓶なら、ひとりで飲みきれます。", "缶は、ひとりで飲みきれる小さなものを選びます。"],
      },
      {
        no: "03",
        title: "味",
        lines: ["食事が始まると、甘い飲みものだけでは続きません。", "砂糖の入っていない炭酸水やお茶を何本か混ぜておくと、料理と一緒に飲めます。"],
      },
    ],
    groups: [
      {
        id: "kanpai",
        title: "乾杯で手に持つ瓶",
        line: "果物の色が見える、ひとりで飲みきれる瓶です。",
        slugs: ["kimino-mikan", "kimino-ringo", "kimura-shine-muscat", "kimura-mikan-cider"],
      },
      {
        id: "can",
        title: "ひとりで飲みきれる小さな缶",
        line: "果物の小さな缶です。ひとりに一本ずつ配れます。",
        slugs: ["pom-harehime-190", "kobe-orange100-185", "kobe-grape-bitan-185", "shiny-nebuta-190"],
      },
      {
        id: "meal",
        title: "食事に合う甘くない一本",
        line: "砂糖の入っていない炭酸水とお茶です。料理と一緒に飲めます。",
        slugs: ["perrier-glass-330", "dydo-wano-yuzu", "sangaria-houjicha-500", "kuro-oolong-350"],
      },
    ],
    backLink: "ふだんの会社の飲み会に向くドリンクを、瓶、小さな缶、甘くない一本に分けています。",
    invite: { note: "人数と、お酒を飲まない人の数がわかったら、本数を決めます。", headline: ["乾杯の瓶と、", "食事のお茶を。"] },
  },
  {
    slug: "kansougeikai",
    hero: "scene-kansougeikai",
    eyebrow: "飲み会",
    proseLabel: "この飲み会",
    title: "歓送迎会のノンアルコール",
    short: "歓送迎会",
    description:
      "春の歓迎会や送別会で、お酒を飲まない人にも配れるノンアルコール飲料を選べます。乾杯でそろえる瓶、主役に渡す一本、甘さ控えめの一本に分けて紹介しています。",
    lead: "3月と4月の歓迎会や送別会で、お酒を飲まない人のぶんを選ぶページです。",
    prose:
      "歓送迎会は、異動や入社で顔ぶれが変わる3月と4月に集まります。来たばかりの人や送られる人が、お酒を飲まないこともあります。乾杯の瓶を全員でそろえておけば、主役も同じタイミングで瓶を持てます。会の終わりに、主役へ一本渡すのもいい方法です。",
    criteria: [
      {
        no: "01",
        title: "見た目",
        lines: ["春らしい桃色やいちご色の瓶を選ぶと、写真に残しても明るく見えます。", "主役に渡す一本は、形やラベルが目に留まるものにします。"],
      },
      {
        no: "02",
        title: "サイズ",
        lines: ["乾杯の瓶は、ひとりで飲みきれる小さなものをそろえます。", "主役に渡す一本は、持ち帰りやすい300mlまでにします。"],
      },
      {
        no: "03",
        title: "味",
        lines: ["果物の甘い瓶が多くなりがちなので、甘さ控えめのものも混ぜます。", "レモンや柑橘のすっきりした炭酸があると、食事のあいだも飲めます。"],
      },
    ],
    groups: [
      {
        id: "kanpai",
        title: "乾杯でそろえる、春の色の瓶",
        line: "桃といちごの瓶です。全員に同じものを配ると、そろって見えます。",
        slugs: ["kimino-momo", "makubetsu-ichigo-cider", "kimura-momo-cider", "kimura-ichigo-cider"],
      },
      {
        id: "gift",
        title: "主役に渡す一本",
        line: "りんごの形の瓶や梅のラベルなど、渡したときに話のきっかけになる瓶です。",
        slugs: ["martinelli-apple-296", "kimino-ume", "frula-lafrance", "shinshu-purple-cider-245"],
      },
      {
        id: "light",
        title: "甘さ控えめの一本",
        line: "食事と一緒に飲みたい人のために、甘さ控えめのものや砂糖の入っていないものを混ぜます。",
        slugs: ["amaou-cider-245", "maison-perrier-raspberry-330", "hiroshima-lemon-moshio-250", "hyuganatsu-cider-245"],
      },
    ],
    backLink: "春の歓迎会と送別会で配れる瓶を、乾杯の瓶、主役に渡す一本、甘さ控えめの一本に分けています。",
    invite: { note: "人数がわかったら、乾杯の瓶をそろえて、主役のぶんを一本足します。", headline: ["そろいの瓶と、", "主役に一本。"] },
  },
  {
    slug: "sashiire",
    hero: "scene-sashiire",
    eyebrow: "差し入れ",
    proseLabel: "この差し入れ",
    title: "差し入れ・手土産のノンアルコール",
    short: "差し入れ・手土産",
    description:
      "職場への差し入れや、訪問先への手土産に選べるノンアルコール飲料です。土地の名前が入った瓶、配りやすい小さな缶、甘くないお茶と炭酸水に分けて紹介しています。",
    lead: "職場や訪問先に持っていく飲みものを選ぶページです。",
    prose:
      "差し入れは、受け取った人がすぐに配れるかどうかが大事です。小さな缶なら、ひとりに一本ずつ渡せて、冷蔵庫にも入れやすくなります。訪問先への手土産なら、土地の名前が入った瓶を選ぶと、話のきっかけになります。受け取る人がお酒を飲むかどうかは、気にしなくてすみます。",
    criteria: [
      {
        no: "01",
        title: "見た目",
        lines: ["手土産には、伊豆や道後、小田原など、土地の名前が入った瓶がおすすめです。", "差し入れには、何の味かがひと目でわかる缶を選びます。"],
      },
      {
        no: "02",
        title: "サイズ",
        lines: ["185mlや190gの小さな缶なら、ひとりで飲みきれます。", "お茶や炭酸水は500〜600mlのペットボトルにすると、机に置いておけます。"],
      },
      {
        no: "03",
        title: "味",
        lines: ["受け取る人の好みはわからないので、甘いものと甘くないものを両方そろえます。", "砂糖の入っていないお茶や炭酸水があると、仕事の合間にも飲めます。"],
      },
    ],
    groups: [
      {
        id: "local",
        title: "土地の名前が入った瓶",
        line: "レモン、みかん、温泉の町のサイダー。手土産に向く瓶です。",
        slugs: ["kataura-lemon-cider-330", "kimura-izu-lemon", "dogo-cider-330", "odawara-mikan-cider-330"],
      },
      {
        id: "can",
        title: "配りやすい小さな缶",
        line: "果汁やはちみつを使った小さな缶です。ひとりに一本ずつ配れます。",
        slugs: ["kobe-lemonade-soda-185", "kobe-shikuwasa-soda-185", "pom-kawachi-190", "kobe-grape100-185"],
      },
      {
        id: "plain",
        title: "甘くないお茶と炭酸水",
        line: "砂糖の入っていないお茶と炭酸水です。",
        slugs: ["oiocha-pure-green-600", "kobe-chabo-jasmine-500", "awa-bancha-500", "dydo-wano-lemon"],
      },
    ],
    backLink: "職場への差し入れや手土産に向くドリンクを、土地の瓶、小さな缶、甘くないお茶に分けています。",
    invite: { note: "人数がわかったら、缶の数を決めます。", headline: ["配れる缶と、", "土地の瓶を。"] },
  },
  {
    slug: "nomanai-hito",
    hero: "scene-nomanai-hito",
    eyebrow: "贈りもの",
    proseLabel: "この一本",
    title: "お酒を飲まない人に渡す一本",
    titleLines: ["お酒を飲まない人に", "渡す一本"],
    short: "飲まない人に渡す一本",
    description:
      "お酒を飲まない人へのお礼や手土産に選べるノンアルコール飲料です。ラベルで選ぶ瓶、家族で分けられる大きな瓶、甘くない一本に分けて紹介しています。",
    lead: "お酒を飲まない人に、お礼や手土産として渡す一本を選ぶページです。",
    prose:
      "贈る相手がお酒を飲まない人だと、何を選ぶか迷いがちです。ラベルに話のたねがある瓶や、家族で分けられる大きな瓶なら、受け取った人も気軽に開けられます。年末のあいさつや年始の訪問など、冬は渡す機会が増えます。甘いものが苦手な人もいるので、甘くない一本も候補に入れておきましょう。",
    criteria: [
      {
        no: "01",
        title: "見た目",
        lines: ["招き猫やオリーブなど、ラベルに話のたねがある瓶を選ぶと、渡すときに会話が生まれます。", "瓶のまま渡しても、見た目で選んだことが伝わります。"],
      },
      {
        no: "02",
        title: "サイズ",
        lines: ["ひとりで飲む人には、小さな瓶を一本。", "家族で分けるなら、720〜780mlの大きな瓶を選びます。"],
      },
      {
        no: "03",
        title: "味",
        lines: ["甘いものが苦手な人には、甘くない一本を。", "炭酸水や無糖の紅茶、ドライなジンジャーエールなら、食事のときにも飲めます。"],
      },
    ],
    groups: [
      {
        id: "label",
        title: "ラベルで選ぶ瓶",
        line: "招き猫、塩、オリーブ、キウイ。ラベルに話のたねがある小さな瓶です。",
        slugs: ["kimura-fukuneko", "noda-shio-cider", "shodoshima-olive-cider-200", "kimura-kiwi-cider"],
      },
      {
        id: "family",
        title: "家族で分けられる大きな瓶",
        line: "りんご、みかん、パイナップルの果汁と、炭酸の入っていない水です。",
        slugs: ["ringowork-sweet-720", "pom-mikan-straight-780", "delmonte-pineapple-750", "acqua-panna-750"],
      },
      {
        id: "dry",
        title: "甘くない一本",
        line: "甘いものが苦手な人にも渡せる、炭酸水と無糖の紅茶、ドライなジンジャーエールです。",
        slugs: ["sanpellegrino-sparkling-250", "kimura-wasabi-ginger", "ucc-teatime-straight-900", "pokka-chiran-tea"],
      },
    ],
    backLink: "お礼や手土産として、お酒を飲まない人に渡す一本を、ラベルで選ぶ瓶、大きな瓶、甘くない一本に分けています。",
    invite: { note: "相手の好みがわからないときは、甘いものと甘くないものを一本ずつ選びます。", headline: ["迷ったら、", "二本に分けて。"] },
  },
];

export function getScene(slug: string): Scene | undefined {
  return SCENES.find((scene) => scene.slug === slug);
}

/** The drinks of a group that are public and have a real still, in the order written. */
/** A scene group is one row of four, so a demoted drink (data/demote-rule.json) would open it. */
export function groupDrinks(group: SceneGroup): Drink[] {
  const drinks = group.slugs
    .map((slug) => getDrink(slug))
    .filter((drink): drink is Drink => Boolean(drink && hasRealStill(drink)));
  for (const drink of drinks) {
    if (isDemoted(drink)) {
      throw new Error(`scene group ${group.id} lists demoted ${drink.slug}`);
    }
  }
  return drinks;
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
