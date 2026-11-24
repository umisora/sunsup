/**
 * Nearby drinks for the comparison table on a drink page.
 * Rows are chosen from published, non-demoted drinks: same flavor in the name,
 * then the same category or tag, then a close volume. The ちがい line is always
 * relative to the current page's drink; shared attributes are left unsaid.
 * Neighbours with no real difference are skipped.
 */
import type { Drink } from "./drinks";
import { categoryKey } from "./drinks";
import { isDemoted } from "./demote";
import { servingUnit, vesselLabel, volumeMl } from "./servings";
import { tagsForDrink } from "./tags";

export const SIMILAR_HEADING = "似ているドリンク";
export const COLUMN_NAME = "品名";
export const COLUMN_VOLUME = "容量";
export const COLUMN_DIFFERENCE = "ちがい";

export const SIMILAR_MAX = 3;
export const SIMILAR_MIN = 2;

/** Longer matches first, so グレープフルーツ wins over グレープ. */
const FLAVORS: { match: string; label: string }[] = [
  { match: "シャインマスカット", label: "シャインマスカット" },
  { match: "グレープフルーツ", label: "グレープフルーツ" },
  { match: "パイナップル", label: "パイナップル" },
  { match: "ジンジャーブレッド", label: "ジンジャーブレッド" },
  { match: "レモンジンジャー", label: "レモンジンジャー" },
  { match: "スパークリング", label: "スパークリング" },
  { match: "ポンペルモ", label: "グレープフルーツ" },
  { match: "お濃い抹茶", label: "濃い抹茶" },
  { match: "ほうじ茶", label: "ほうじ茶" },
  { match: "ジンジャー", label: "しょうが" },
  { match: "しょうが", label: "しょうが" },
  { match: "ラズベリー", label: "ラズベリー" },
  { match: "ブルーベリー", label: "ブルーベリー" },
  { match: "マスカット", label: "マスカット" },
  { match: "あまおう", label: "あまおう" },
  { match: "とちおとめ", label: "いちご" },
  { match: "トマト", label: "トマト" },
  { match: "いちご", label: "いちご" },
  { match: "レモン", label: "レモン" },
  { match: "ライム", label: "ライム" },
  { match: "みかん", label: "みかん" },
  { match: "オレンジ", label: "オレンジ" },
  { match: "りんご", label: "りんご" },
  { match: "アップル", label: "りんご" },
  { match: "ぶどう", label: "ぶどう" },
  { match: "グレープ", label: "ぶどう" },
  { match: "巨峰", label: "巨峰" },
  { match: "白桃", label: "白桃" },
  { match: "洋なし", label: "洋なし" },
  { match: "マンゴー", label: "マンゴー" },
  { match: "メロン", label: "メロン" },
  { match: "すいか", label: "すいか" },
  { match: "スイカ", label: "すいか" },
  { match: "パイン", label: "パイン" },
  { match: "ベリー", label: "ベリー" },
  { match: "抹茶", label: "抹茶" },
  { match: "ほうじ", label: "ほうじ茶" },
  { match: "緑茶", label: "緑茶" },
  { match: "紅茶", label: "紅茶" },
  { match: "ウーロン", label: "ウーロン茶" },
  { match: "烏龍", label: "ウーロン茶" },
  { match: "ジャスミン", label: "ジャスミン茶" },
  { match: "サイダー", label: "サイダー" },
  { match: "ラムネ", label: "ラムネ" },
  { match: "コーラ", label: "コーラ" },
  { match: "炭酸水", label: "炭酸水" },
  { match: "炭酸", label: "炭酸" },
  { match: "ソーダ", label: "ソーダ" },
  { match: "豆乳", label: "豆乳" },
  { match: "ヨーグルト", label: "ヨーグルト" },
  { match: "コーヒー", label: "コーヒー" },
  { match: "シロップ", label: "シロップ" },
  { match: "ずんだ", label: "ずんだ" },
  { match: "わさび", label: "わさび" },
  { match: "ワサビ", label: "わさび" },
  { match: "ゆず", label: "ゆず" },
  { match: "柚子", label: "ゆず" },
  { match: "YUZU", label: "ゆず" },
  { match: "蜜柑", label: "みかん" },
  { match: "林檎", label: "りんご" },
  { match: "葡萄", label: "ぶどう" },
  { match: "苺", label: "いちご" },
  { match: "もも", label: "もも" },
  { match: "桃", label: "もも" },
  { match: "梅", label: "梅" },
  { match: "梨", label: "梨" },
  { match: "生姜", label: "しょうが" },
  { match: "さくら", label: "さくら" },
  { match: "桜", label: "さくら" },
  { match: "甘夏", label: "甘夏" },
  { match: "はっさく", label: "はっさく" },
  { match: "じゃばら", label: "じゃばら" },
  { match: "じゃぼん", label: "じゃぼん" },
  { match: "ネクター", label: "ネクター" },
];

const FLAVORS_BY_LENGTH = [...FLAVORS].sort((a, b) => b.match.length - a.match.length);

export type SimilarDrinkRow = {
  drink: Drink;
  volume: string;
  difference: string;
};

export type DifferenceFact = {
  kind:
    | "flavor"
    | "brand"
    | "word"
    | "unsweetened"
    | "sweetened"
    | "fizz"
    | "still"
    | "dilute"
    | "ready"
    | "vessel"
    | "size"
    | "servings"
    | "series";
  text: string;
};

export function flavorLabels(name: string): string[] {
  const found: string[] = [];
  let rest = name;
  for (const flavor of FLAVORS_BY_LENGTH) {
    if (rest.includes(flavor.match) && !found.includes(flavor.label)) {
      found.push(flavor.label);
      rest = rest.split(flavor.match).join("");
    }
  }
  return found;
}

/** Broader names a specific label also counts as, so 濃い抹茶 still matches 抹茶. */
const FLAVOR_FAMILY: Record<string, readonly string[]> = {
  濃い抹茶: ["抹茶"],
  レモンジンジャー: ["レモン", "しょうが"],
  ジンジャーブレッド: ["しょうが"],
  シャインマスカット: ["マスカット"],
  あまおう: ["いちご"],
  白桃: ["もも"],
  巨峰: ["ぶどう"],
};

function flavorFamily(labels: readonly string[]): Set<string> {
  const set = new Set(labels);
  for (const label of labels) {
    for (const parent of FLAVOR_FAMILY[label] ?? []) {
      set.add(parent);
    }
  }
  return set;
}

function tagIds(slug: string): string[] {
  return tagsForDrink(slug).map((tag) => tag.id);
}

function firstToken(name: string): string {
  return (name.split(/\s+/)[0] ?? "").replace(/\d+(?:\.\d+)?(?:ml|mL|ML|ｍｌ|L|ℓ|g)$/i, "");
}

function commonPrefixLength(left: string, right: string): number {
  const limit = Math.min(left.length, right.length);
  let index = 0;
  while (index < limit && left[index] === right[index]) {
    index += 1;
  }
  return index;
}

function sameVolumeUnit(left: { label: string; ml: number }, right: { label: string; ml: number }): boolean {
  return left.label.endsWith("g") === right.label.endsWith("g");
}

function volumeCloseness(current: Drink, other: Drink): number {
  const left = volumeMl(current);
  const right = volumeMl(other);
  if (!left || !right || !sameVolumeUnit(left, right)) {
    return 0;
  }
  return Math.max(0, 60 - Math.abs(left.ml - right.ml) / 10);
}

function scoreSimilar(current: Drink, other: Drink): number {
  let score = 0;
  if (categoryKey(current.category) === categoryKey(other.category)) {
    score += 50;
  }
  const currentTags = new Set(tagIds(current.slug));
  for (const tag of tagIds(other.slug)) {
    if (currentTags.has(tag)) {
      score += 40;
    }
  }
  const currentFlavors = flavorFamily(flavorLabels(current.name));
  for (const label of flavorFamily(flavorLabels(other.name))) {
    if (currentFlavors.has(label)) {
      score += 120;
    }
  }
  score += volumeCloseness(current, other);
  if (current.vessel.trim() && current.vessel.trim() === other.vessel.trim()) {
    score += 20;
  }
  const brand = commonPrefixLength(firstToken(current.name), firstToken(other.name));
  if (brand >= 2) {
    score += 40 + Math.min(20, brand);
  }
  return score;
}

const CAN_VESSELS = new Set(["缶", "小さな缶", "ボトル缶"]);
const BOTTLE_VESSELS = new Set(["瓶", "大きな瓶"]);

const FIZZ_TOKENS = [
  "サイダー",
  "ラムネ",
  "コーラ",
  "炭酸水",
  "炭酸",
  "タンサン",
  "ソーダ",
  "スパークリング",
  "スカッシュ",
  "トニック",
  "ジンジャーエール",
  "ジンジャエール",
] as const;

const FIZZ_BRANDS = [
  "サンペレグリノ",
  "ペリエ",
  "ウィルキンソン",
  "カナダドライ",
  "ファンタ",
  "スプライト",
  "メッツ",
  "三ツ矢",
  "C.C.レモン",
  "CCレモン",
  "Ｃ．Ｃ．レモン",
  "キレートレモン",
  "ナポリン",
] as const;

const FIZZ_FLAVOR_LABELS = new Set(["サイダー", "ラムネ", "コーラ", "炭酸水", "炭酸", "ソーダ", "スパークリング"]);

const GENERIC_WORDS = [
  "ジュース",
  "ネクター",
  "飲料",
  "ドリンク",
  "ミックス",
  "ラテ",
  "オレ",
  "ストレート",
  "プレミアム",
  "仕立て",
  "ティー",
  "フルーツ",
  "果実",
  "果汁",
];

const VOLUME_RE = /\d+(?:\.\d+)?(?:ml|mL|ML|ｍｌ|L|ℓ|g)\b/gi;

const SIZE_MIN = 50;
const SIZE_LARGE = 300;

function sameVesselFamily(left: string, right: string): boolean {
  if (left === right) {
    return true;
  }
  return (CAN_VESSELS.has(left) && CAN_VESSELS.has(right)) || (BOTTLE_VESSELS.has(left) && BOTTLE_VESSELS.has(right));
}

export function isFizzy(name: string): boolean {
  return FIZZ_TOKENS.some((token) => name.includes(token)) || FIZZ_BRANDS.some((brand) => name.includes(brand));
}

function brandOf(name: string): string | undefined {
  if (!/\s/.test(name)) {
    return undefined;
  }
  const first = firstToken(name);
  if (first.length < 2) {
    return undefined;
  }
  if (FLAVORS.some((flavor) => first.includes(flavor.match) || first === flavor.label)) {
    return undefined;
  }
  return first;
}

const VESSEL_WORDS = new Set(["瓶", "ビン", "缶", "カップ", "紙パック", "ペットボトル", "パウチ", "ボトル", "パック"]);

function isPlaceOrMakerToken(token: string): boolean {
  if (token.length < 2 || token.length > 8) {
    return false;
  }
  if (VESSEL_WORDS.has(token)) {
    return false;
  }
  const hiragana = (token.match(/[ぁ-ゟ]/g) ?? []).length;
  if (hiragana > token.length / 2) {
    return false;
  }
  return /[\u4E00-\u9FFFァ-ヶーA-Za-z]/.test(token);
}

/** Fold script and spelling so BLACK and ブラック, or 無糖, are not treated as a difference. */
function foldedName(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/無糖/g, " ")
    .replace(/ブラック/g, "black")
    .replace(/ホワイト/g, "white")
    .replace(/\s+/g, " ")
    .trim();
}

function distinctiveWord(current: Drink, other: Drink): string | undefined {
  let rest = other.name.replace(VOLUME_RE, " ");
  for (const flavor of FLAVORS_BY_LENGTH) {
    rest = rest.split(flavor.match).join(" ");
  }
  for (const word of GENERIC_WORDS) {
    rest = rest.split(word).join(" ");
  }
  rest = rest.replace(/無糖/g, " ");
  rest = rest.replace(/[0-9０-９.%％&＋+]/g, " ").replace(/\s+/g, " ").trim();
  const otherBrand = brandOf(other.name);
  const currentBrand = brandOf(current.name);
  const currentFolded = foldedName(current.name);
  return rest
    .split(/\s+/)
    .find(
      (token) =>
        isPlaceOrMakerToken(token) &&
        token !== otherBrand &&
        token !== currentBrand &&
        !currentFolded.includes(foldedName(token)),
    );
}

/** Labels that name the drink type, not a difference, when the current name already implies them. */
const TYPE_FLAVOR_HINTS: Record<string, RegExp> = {
  コーヒー: /コーヒー|珈琲|カフェ|ブラック|black|ラテ/i,
  シロップ: /シロップ/,
};

function uniqueFlavor(current: Drink, other: Drink): string | undefined {
  const currentLabels = flavorFamily(flavorLabels(current.name));
  return flavorLabels(other.name).find((label) => {
    if (currentLabels.has(label)) {
      return false;
    }
    const hint = TYPE_FLAVOR_HINTS[label];
    return !hint || !hint.test(current.name);
  });
}

function peopleReady(drink: Drink): number | undefined {
  const unit = servingUnit(drink);
  if (!unit || unit.dilute) {
    return undefined;
  }
  return unit.people;
}

function sizePhrase(current: Drink, other: Drink): string | undefined {
  const left = volumeMl(current);
  const right = volumeMl(other);
  if (!left || !right || !sameVolumeUnit(left, right)) {
    return undefined;
  }
  const delta = right.ml - left.ml;
  const abs = Math.abs(delta);
  if (abs < SIZE_MIN) {
    return undefined;
  }
  const large = abs >= SIZE_LARGE || right.ml >= left.ml * 2 || left.ml >= right.ml * 2;
  if (delta > 0) {
    return large ? "かなり大きい。" : "少し大きい。";
  }
  return large ? "かなり小さい。" : "少し小さい。";
}

export function differenceFacts(current: Drink, other: Drink): DifferenceFact[] {
  const facts: DifferenceFact[] = [];
  const currentFizz = isFizzy(current.name);
  const otherFizz = isFizzy(other.name);
  const flavor = uniqueFlavor(current, other);
  if (flavor && !(FIZZ_FLAVOR_LABELS.has(flavor) && currentFizz !== otherFizz)) {
    facts.push({ kind: "flavor", text: `こちらは${flavor}。` });
  } else {
    const word = distinctiveWord(current, other);
    const otherBrand = brandOf(other.name);
    const currentBrand = brandOf(current.name);
    if (word) {
      facts.push({ kind: "word", text: `こちらは${word}。` });
    } else if (otherBrand && otherBrand !== currentBrand) {
      facts.push({ kind: "brand", text: `こちらは${otherBrand}。` });
    }
  }

  const currentMutou = tagIds(current.slug).includes("mutou");
  const otherMutou = tagIds(other.slug).includes("mutou");
  if (otherMutou && !currentMutou) {
    facts.push({ kind: "unsweetened", text: "無糖。" });
  } else if (currentMutou && !otherMutou) {
    facts.push({ kind: "sweetened", text: "無糖ではない。" });
  }

  if (otherFizz && !currentFizz) {
    facts.push({ kind: "fizz", text: "炭酸。" });
  } else if (currentFizz && !otherFizz) {
    facts.push({ kind: "still", text: "炭酸なし。" });
  }

  const currentServing = servingUnit(current);
  const otherServing = servingUnit(other);
  if (currentServing?.dilute !== true && otherServing?.dilute === true) {
    facts.push({ kind: "dilute", text: "割って飲む。" });
  } else if (currentServing?.dilute === true && otherServing?.dilute !== true) {
    facts.push({ kind: "ready", text: "そのまま飲める。" });
  }

  const currentPeople = peopleReady(current);
  const otherPeople = peopleReady(other);
  if (currentPeople === 1 && otherPeople !== undefined && otherPeople >= 2) {
    facts.push({ kind: "servings", text: "何人かで分けられる。" });
  } else if (currentPeople !== undefined && currentPeople >= 2 && otherPeople === 1) {
    facts.push({ kind: "servings", text: "ひとりで飲みきれる。" });
  }

  const currentVessel = vesselLabel(current.vessel);
  const otherVessel = vesselLabel(other.vessel);
  if (currentVessel && otherVessel && !sameVesselFamily(currentVessel, otherVessel)) {
    facts.push({ kind: "vessel", text: `${otherVessel}。` });
  }

  const size = sizePhrase(current, other);
  if (size) {
    facts.push({ kind: "size", text: size });
  }

  if (facts.length === 0) {
    const brand = brandOf(current.name);
    const otherBrand = brandOf(other.name);
    if (brand && brand === otherBrand) {
      facts.push({ kind: "series", text: `同じ${brand}の別の一本。` });
    }
  }

  return facts;
}

export function differenceText(current: Drink, other: Drink): string {
  return differenceFacts(current, other)
    .slice(0, 2)
    .map((fact) => fact.text)
    .join("");
}

function hasClause(text: string, clause: string): boolean {
  return text === clause || text.startsWith(clause) || text.includes(`。${clause}`);
}

const ABSOLUTE_LEAK = /容量は|同じカテゴリ|の缶です|の瓶です|のペットボトルです|のカップです|の紙パックです|飲みます|飲めます/;

/** Phrases that restate something true of both drinks, or an absolute size. */
export function sameAttributeMentions(current: Drink, other: Drink, text: string): string[] {
  const leaks: string[] = [];
  if (!text.trim()) {
    return ["empty"];
  }
  if (ABSOLUTE_LEAK.test(text)) {
    leaks.push("absolute-phrase");
  }

  const currentVolume = volumeMl(current);
  const otherVolume = volumeMl(other);
  const sizeIsReal = Boolean(
    currentVolume && otherVolume && sameVolumeUnit(currentVolume, otherVolume) && Math.abs(currentVolume.ml - otherVolume.ml) >= SIZE_MIN,
  );
  if (otherVolume && text.includes(otherVolume.label) && !sizeIsReal) {
    leaks.push(`volume:${otherVolume.label}`);
  }
  const mentionsSizeWord = /少し大き[いく]|少し小さ[いく]|かなり大き[いく]|かなり小さ[いく]/.test(text);
  if (mentionsSizeWord && !sizeIsReal) {
    leaks.push("size-not-meaningful");
  }

  const currentVessel = vesselLabel(current.vessel);
  const otherVessel = vesselLabel(other.vessel);
  if (currentVessel && otherVessel && sameVesselFamily(currentVessel, otherVessel)) {
    if (hasClause(text, `${otherVessel}。`) || hasClause(text, `${currentVessel}。`)) {
      leaks.push("vessel");
    }
  }

  const currentMutou = tagIds(current.slug).includes("mutou");
  const otherMutou = tagIds(other.slug).includes("mutou");
  if (currentMutou === otherMutou && text.includes("無糖")) {
    leaks.push("unsweetened");
  }

  if (isFizzy(current.name) === isFizzy(other.name) && (text.includes("炭酸。") || text.includes("炭酸なし"))) {
    leaks.push("fizz");
  }

  const currentDilute = servingUnit(current)?.dilute === true;
  const otherDilute = servingUnit(other)?.dilute === true;
  if (currentDilute === otherDilute && (text.includes("割って飲む") || text.includes("そのまま飲める"))) {
    leaks.push("dilute");
  }

  const currentPeople = peopleReady(current);
  const otherPeople = peopleReady(other);
  const servingsDiffer =
    (currentPeople === 1 && otherPeople !== undefined && otherPeople >= 2) ||
    (currentPeople !== undefined && currentPeople >= 2 && otherPeople === 1);
  if (!servingsDiffer && (text.includes("何人かで分けられる") || text.includes("ひとりで飲みきれる"))) {
    leaks.push("servings");
  }

  const sharedFlavors = flavorFamily(flavorLabels(current.name));
  for (const label of flavorLabels(other.name)) {
    if (sharedFlavors.has(label) && text.includes(`こちらは${label}。`)) {
      leaks.push(`flavor:${label}`);
    }
  }

  return leaks;
}

export function similarDrinks(current: Drink, catalog: readonly Drink[]): SimilarDrinkRow[] {
  const pool = catalog.filter((drink) => drink.slug !== current.slug && !isDemoted(drink));
  const ranked = pool
    .map((drink, index) => ({
      drink,
      index,
      score: scoreSimilar(current, drink),
      flavors: [...flavorFamily(flavorLabels(current.name))].filter((label) =>
        flavorFamily(flavorLabels(drink.name)).has(label),
      ).length,
      sameCategory: categoryKey(current.category) === categoryKey(drink.category) ? 1 : 0,
      volumeGap: (() => {
        const left = volumeMl(current);
        const right = volumeMl(drink);
        if (!left || !right || !sameVolumeUnit(left, right)) {
          return Number.POSITIVE_INFINITY;
        }
        return Math.abs(left.ml - right.ml);
      })(),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.flavors - a.flavors ||
        b.sameCategory - a.sameCategory ||
        a.volumeGap - b.volumeGap ||
        a.index - b.index,
    );

  return ranked
    .filter((item) => item.score > 0 && differenceFacts(current, item.drink).length > 0)
    .slice(0, SIMILAR_MAX)
    .map((item) => ({
      drink: item.drink,
      volume: volumeMl(item.drink)?.label ?? "",
      difference: differenceText(current, item.drink),
    }));
}
