/**
 * Nearby drinks for the comparison table on a drink page.
 * Rows are chosen from published, non-demoted drinks: same flavor in the name,
 * then the same category or tag, then a close volume. The ちがい line is built
 * from those data differences only; nothing is written by hand for a drink.
 */
import type { Drink } from "./drinks";
import { categoryKey } from "./drinks";
import { isDemoted } from "./demote";
import { servingUnit, vesselLabel, volumeMl } from "./servings";
import { tagsForDrink } from "./tags";

export const SIMILAR_HEADING = "似ているドリンク";
export const COLUMN_NAME = "品名";
export const COLUMN_VOLUME = "容量";
export const COLUMN_SERVINGS = "何人分";
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
  servings: string;
  difference: string;
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

function servingsDisplay(drink: Drink): string {
  return servingUnit(drink)?.text ?? "";
}

function servingsPhrase(text: string): string {
  if (text === "割って飲む") {
    return "割って飲みます。";
  }
  return `${text}です。`;
}

function uniqueFlavor(current: Drink, other: Drink): string | undefined {
  const currentLabels = flavorFamily(flavorLabels(current.name));
  return flavorLabels(other.name).find((label) => !currentLabels.has(label));
}

export function differenceText(current: Drink, other: Drink): string {
  const currentVolume = volumeMl(current);
  const otherVolume = volumeMl(other);
  const currentVessel = vesselLabel(current.vessel);
  const otherVessel = vesselLabel(other.vessel);
  const currentServing = servingUnit(current);
  const otherServing = servingUnit(other);
  const otherUnsweetened = tagIds(other.slug).includes("mutou") && !tagIds(current.slug).includes("mutou");
  const flavor = uniqueFlavor(current, other);
  const categoryDiffers = categoryKey(current.category) !== categoryKey(other.category);

  const parts: string[] = [];
  let volumeUsed = false;

  if (currentServing?.dilute !== true && otherServing?.dilute === true) {
    parts.push("割って飲みます。");
  } else if (currentServing?.dilute === true && otherServing?.dilute !== true) {
    parts.push("そのまま飲めます。");
  }

  if (otherUnsweetened) {
    parts.push("無糖です。");
  }

  const vesselDiffers = Boolean(currentVessel && otherVessel && currentVessel !== otherVessel);
  const volumeDiffers = Boolean(
    otherVolume && (!currentVolume || currentVolume.label !== otherVolume.label),
  );
  const sameUnitMl =
    currentVolume && otherVolume && !currentVolume.label.endsWith("g") && !otherVolume.label.endsWith("g");
  const delta = sameUnitMl ? otherVolume!.ml - currentVolume!.ml : 0;
  const absDelta = Math.abs(delta);
  const largeJump = absDelta >= 300 || (currentVolume && otherVolume && (otherVolume.ml >= currentVolume.ml * 2 || currentVolume.ml >= otherVolume.ml * 2));

  if (vesselDiffers && otherVolume && volumeDiffers) {
    parts.push(`${otherVolume.label}の${otherVessel}です。`);
    volumeUsed = true;
  } else if (vesselDiffers) {
    parts.push(`${otherVessel}です。`);
  }

  if (flavor) {
    parts.push(`${flavor}です。`);
  }

  if (!volumeUsed && otherVolume && volumeDiffers) {
    if (sameUnitMl && absDelta >= 50 && !largeJump) {
      parts.push(delta > 0 ? `容量が${absDelta}ml多いです。` : `容量が${absDelta}ml少ないです。`);
    } else {
      parts.push(`容量は${otherVolume.label}です。`);
    }
    volumeUsed = true;
  }

  if (categoryDiffers) {
    parts.push(`${other.category}です。`);
  }

  if (
    parts.length === 0 &&
    otherServing &&
    currentServing &&
    otherServing.text !== currentServing.text
  ) {
    parts.push(servingsPhrase(otherServing.text));
  }

  if (parts.length === 0) {
    if (currentVolume && otherVolume && currentVolume.label === otherVolume.label) {
      return "容量は同じです。";
    }
    return "同じカテゴリです。";
  }

  return parts.slice(0, 2).join("");
}

export function similarDrinks(current: Drink, catalog: readonly Drink[]): SimilarDrinkRow[] {
  const pool = catalog.filter((drink) => drink.slug !== current.slug && !isDemoted(drink));
  const ranked = pool
    .map((drink, index) => ({
      drink,
      index,
      score: scoreSimilar(current, drink),
      flavors: [...flavorFamily(flavorLabels(current.name))].filter((label) => flavorFamily(flavorLabels(drink.name)).has(label)).length,
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

  const picked = ranked.filter((item) => item.score > 0).slice(0, SIMILAR_MAX);
  const rows = (picked.length >= SIMILAR_MIN ? picked : ranked.slice(0, Math.min(SIMILAR_MAX, ranked.length))).map(
    (item) => ({
      drink: item.drink,
      volume: volumeMl(item.drink)?.label ?? "",
      servings: servingsDisplay(item.drink),
      difference: differenceText(current, item.drink),
    }),
  );
  return rows;
}
