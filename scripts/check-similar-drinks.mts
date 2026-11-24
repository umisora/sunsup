// Selection and ちがい phrases for the drink comparison table, plus (with --export)
// a check that published drink pages render two or three linked rows.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isDemoted } from "../lib/demote.ts";
import { getDrink, loadDrinks, type Drink } from "../lib/drinks.ts";
import {
  COLUMN_DIFFERENCE,
  COLUMN_NAME,
  COLUMN_SERVINGS,
  COLUMN_VOLUME,
  SIMILAR_HEADING,
  SIMILAR_MAX,
  SIMILAR_MIN,
  differenceText,
  flavorLabels,
  similarDrinks,
} from "../lib/similar-drinks.ts";

const failures: string[] = [];
function expect(ok: boolean, message: string) {
  if (!ok) {
    failures.push(message);
  }
}

function drink(partial: Partial<Drink> & Pick<Drink, "slug" | "name" | "category" | "vessel">): Drink {
  return {
    stillUrl: "",
    place: "場です。",
    look: "見た目です。",
    size: "",
    taste: "味です。",
    officialUrl: "",
    amazonUrl: "",
    rakutenUrl: "",
    directUrl: "",
    otherUrl: "",
    generic: false,
    titleName: "",
    ...partial,
  };
}

const ciderA = drink({
  slug: "cider-a",
  name: "幕別いちごサイダー",
  category: "ぶどう・ベリー",
  vessel: "ビン",
  size: "瓶です。ひとりに一本渡せば足ります。",
});
const ciderB = drink({
  slug: "cider-b",
  name: "静岡いちごサイダー 240ml",
  category: "クラフト・瓶もの",
  vessel: "ビン",
  size: "240mlの瓶です。",
});
const ciderC = drink({
  slug: "cider-c",
  name: "あまおうサイダー 245ml",
  category: "クラフト・瓶もの",
  vessel: "ビン",
  size: "245mlの瓶です。",
});
const grape = drink({
  slug: "grape",
  name: "ぶどうジュース 240ml",
  category: "ぶどう・ベリー",
  vessel: "ビン",
  size: "240mlの瓶です。",
});
const matchaThick = drink({
  slug: "matcha-thick",
  name: "辻利 お濃い抹茶ラテ 210ml",
  category: "茶・ハーブ",
  vessel: "紙パック",
  size: "210mlの紙パックです。",
});
const matchaPlain = drink({
  slug: "matcha-plain",
  name: "辻利 抹茶ラテ 200ml",
  category: "茶・ハーブ",
  vessel: "紙パック",
  size: "200mlの紙パックです。",
});
const hojicha = drink({
  slug: "hojicha",
  name: "辻利 濃く香るほうじ茶ラテ 210ml",
  category: "茶・ハーブ",
  vessel: "紙パック",
  size: "210mlの紙パックです。",
});
const soy = drink({
  slug: "soy-matcha",
  name: "キッコーマン 豆乳飲料 抹茶 200ml",
  category: "茶・ハーブ",
  vessel: "紙パック",
  size: "200mlの紙パックです。",
});
const pompelmo200 = drink({
  slug: "pomp-200",
  name: "サンペレグリノ ポンペルモ 200ml",
  category: "柑橘・炭酸",
  vessel: "ミニ缶",
  size: "200mlの小さな缶です。",
});
const pompelmo330 = drink({
  slug: "pomp-330",
  name: "サンペレグリノ ポンペルモ 330ml",
  category: "柑橘・炭酸",
  vessel: "缶",
  size: "330mlの缶です。",
});
const syrup = drink({
  slug: "syrup",
  name: "モナン ジンジャーシロップ 700ml",
  category: "クラフト・瓶もの",
  vessel: "大瓶",
  size: "700mlの瓶です。炭酸や水に混ぜます。",
});
const lemonSyrup = drink({
  slug: "lemon-syrup",
  name: "モナン レモンジンジャーシロップ 700ml",
  category: "クラフト・瓶もの",
  vessel: "大瓶",
  size: "700mlの瓶です。炭酸や水に混ぜます。",
});
const readyGinger = drink({
  slug: "ready-ginger",
  name: "しょうがの炭酸 200ml",
  category: "柑橘・炭酸",
  vessel: "ビン",
  size: "200mlの瓶です。",
});

const catalog = [ciderA, ciderB, ciderC, grape, matchaThick, matchaPlain, hojicha, soy, pompelmo200, pompelmo330, syrup, lemonSyrup, readyGinger];

expect(flavorLabels("サンペレグリノ ポンペルモ 200ml").includes("グレープフルーツ"), "ポンペルモ maps to グレープフルーツ");
expect(flavorLabels("辻利 お濃い抹茶ラテ 210ml").includes("濃い抹茶"), "お濃い抹茶 is kept distinct from plain 抹茶");

const forCider = similarDrinks(ciderA, catalog);
expect(forCider.length === 3, `strawberry cider should pick 3, got ${forCider.length}`);
expect(
  forCider.some((row) => row.drink.slug === "cider-b") && forCider.some((row) => row.drink.slug === "cider-c"),
  `strawberry cider should prefer other strawberry ciders, got ${forCider.map((row) => row.drink.slug).join(",")}`,
);

const forMatcha = similarDrinks(matchaThick, catalog);
expect(
  forMatcha[0]?.drink.slug === "matcha-plain" || forMatcha.map((row) => row.drink.slug).includes("matcha-plain"),
  `thick matcha should list the same-brand latte, got ${forMatcha.map((row) => row.drink.slug).join(",")}`,
);
expect(
  forMatcha.some((row) => row.drink.slug === "hojicha"),
  `thick matcha should list the hojicha latte, got ${forMatcha.map((row) => row.drink.slug).join(",")}`,
);

const forPomp = similarDrinks(pompelmo200, catalog);
expect(
  forPomp[0]?.drink.slug === "pomp-330",
  `200ml pompelmo should lead with the 330ml can, got ${forPomp.map((row) => row.drink.slug).join(",")}`,
);
expect(differenceText(pompelmo200, pompelmo330) === "330mlの缶です。", `pompelmo ちがい was ${differenceText(pompelmo200, pompelmo330)}`);

expect(differenceText(matchaThick, hojicha) === "ほうじ茶です。", `hojicha ちがい was ${differenceText(matchaThick, hojicha)}`);
expect(differenceText(matchaThick, matchaPlain) === "容量が10ml少ないです。" || differenceText(matchaThick, matchaPlain).includes("200ml"), `plain matcha ちがい was ${differenceText(matchaThick, matchaPlain)}`);
// 10ml is under the 50ml relative threshold, so it should fall through...
// 200 vs 210, absDelta 10 < 50, not large jump, volumeDiffers true, so it uses 容量は200mlです。
expect(differenceText(matchaThick, matchaPlain) === "容量は200mlです。", `plain matcha ちがい was ${differenceText(matchaThick, matchaPlain)}`);

expect(differenceText(syrup, readyGinger) === "そのまま飲めます。小さな缶です。" || differenceText(syrup, readyGinger).includes("そのまま飲めます。"), `ready ginger ちがい was ${differenceText(syrup, readyGinger)}`);
expect(differenceText(ciderA, ciderB) === "容量は240mlです。" || differenceText(ciderA, ciderB).includes("240ml"), `cider B ちがい was ${differenceText(ciderA, ciderB)}`);

expect(differenceText(pompelmo330, pompelmo200) === "200mlの小さな缶です。", `mini can ちがい was ${differenceText(pompelmo330, pompelmo200)}`);

const live = loadDrinks();
for (const item of live) {
  const rows = similarDrinks(item, live);
  expect(rows.length >= SIMILAR_MIN && rows.length <= SIMILAR_MAX, `${item.slug} has ${rows.length} similar drinks`);
  expect(new Set(rows.map((row) => row.drink.slug)).size === rows.length, `${item.slug} repeated a similar drink`);
  expect(rows.every((row) => row.drink.slug !== item.slug), `${item.slug} listed itself`);
  expect(rows.every((row) => !isDemoted(row.drink)), `${item.slug} listed a demoted drink`);
  expect(rows.every((row) => row.difference.trim() !== ""), `${item.slug} has an empty ちがい`);
  const text = rows.map((row) => `${row.difference}${row.volume}${row.servings}`).join("");
  expect(!text.includes("飲まない人") && !text.includes("酒の代わり") && !text.includes("ノンアル"), `${item.slug} used a banned phrase`);
}

expect(SIMILAR_HEADING === "似ているドリンク", "heading");
expect([COLUMN_NAME, COLUMN_VOLUME, COLUMN_SERVINGS, COLUMN_DIFFERENCE].join("|") === "品名|容量|何人分|ちがい", "column labels");

function checkExport(root = "out") {
  const dir = join(root, "drink");
  if (!existsSync(dir)) {
    failures.push(`missing ${dir}`);
    return;
  }
  const pages = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "shell" || entry.name === "_next") {
      continue;
    }
    const file = join(dir, entry.name, "index.html");
    if (!existsSync(file)) {
      continue;
    }
    pages.push({ slug: entry.name, html: readFileSync(file, "utf8") });
  }
  expect(pages.length === live.length, `export has ${pages.length} drink pages, catalog has ${live.length}`);
  for (const page of pages) {
    const current = getDrink(page.slug);
    if (!current) {
      failures.push(`${page.slug} is in the export but not the catalog`);
      continue;
    }
    const expected = similarDrinks(current, live);
    const headingAt = page.html.indexOf(SIMILAR_HEADING);
    const factsAt = page.html.indexOf("このドリンク");
    const relatedAt = page.html.indexOf("同じカテゴリ");
    const closeAt = page.html.indexOf("次の飲み会に");
    const officeAt = page.html.indexOf("オープンな飲み会");
    if (expected.length === 0) {
      expect(headingAt === -1, `${page.slug} rendered an empty comparison table`);
      continue;
    }
    expect(headingAt !== -1, `${page.slug} is missing ${SIMILAR_HEADING}`);
    for (const row of expected) {
      expect(page.html.includes(`href="/drink/${row.drink.slug}/"`), `${page.slug} is missing a link to ${row.drink.slug}`);
      expect(page.html.includes(row.difference), `${page.slug} is missing ちがい ${row.difference}`);
    }
    expect(factsAt !== -1 && factsAt < headingAt, `${page.slug} does not put the comparison table after the facts`);
    expect(relatedAt === -1 || headingAt < relatedAt, `${page.slug} does not put the comparison table before the same-category list`);
    expect(closeAt !== -1 && headingAt < closeAt, `${page.slug} does not put the close line below the comparison table`);
    expect(closeAt !== -1 && (relatedAt === -1 || relatedAt < closeAt), `${page.slug} does not put the close line below the same-category list`);
    expect(officeAt !== -1 && closeAt < officeAt, `${page.slug} does not put the office block below the close line`);
  }
}

if (process.argv.includes("--export")) {
  checkExport();
}

if (failures.length > 0) {
  for (const message of failures.slice(0, 30)) {
    console.error(message);
  }
  if (failures.length > 30) {
    console.error(`…and ${failures.length - 30} more similar-drink failures`);
  }
  process.exit(1);
}

const sample = getDrink("makubetsu-ichigo-cider");
const sampleRows = sample ? similarDrinks(sample, live) : [];
console.log(
  `similar drinks ok: ${live.length} published drinks, ${SIMILAR_MIN}–${SIMILAR_MAX} neighbours each${process.argv.includes("--export") ? ", export checked" : ""}`,
);
if (sampleRows.length > 0) {
  console.log(`  e.g. makubetsu-ichigo-cider → ${sampleRows.map((row) => `${row.drink.slug}（${row.difference}）`).join(" / ")}`);
}
