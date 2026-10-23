/**
 * Short facts for the first screen of a drink page: volume, container, and how many people one bottle serves.
 * Read from the name and the サイズ line; nothing is guessed when neither says a volume.
 */
import type { Drink } from "./drinks";

const VOLUME = /(\d+(?:\.\d+)?)\s*(ml|mL|ML|ｍｌ|L|ℓ|g)(?![a-zA-Z])/;

/** One person drinks about this much from a shared bottle. 720ml reads as about four people, as the catalog says (三、四人). */
const SHARE_ML = 180;
/** Up to this, a bottle is one person's. Cans, PET and cartons up to PERSONAL_ML are drunk from the container. */
const SINGLE_ML = 400;
const PERSONAL_ML = 650;
const PERSONAL = new Set(["缶", "ミニ缶", "ボトル缶", "ペットボトル", "紙パック", "カップ", "パウチ"]);

const VESSEL: Record<string, string> = {
  ビン: "瓶",
  大瓶: "大きな瓶",
  缶: "缶",
  ミニ缶: "小さな缶",
  ボトル缶: "ボトル缶",
  ペットボトル: "ペットボトル",
  紙パック: "紙パック",
  カップ: "カップ",
  パウチ: "パウチ",
};

export function volumeMl(drink: Pick<Drink, "name" | "size">): { label: string; ml: number } | undefined {
  const match = VOLUME.exec(drink.name) ?? VOLUME.exec(drink.size);
  if (!match) {
    return undefined;
  }
  const value = Number(match[1]);
  if (match[2] === "L" || match[2] === "ℓ") {
    return { label: `${match[1]}L`, ml: value * 1000 };
  }
  return { label: `${match[1]}${match[2] === "g" ? "g" : "ml"}`, ml: value };
}

const KANJI: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
const NUM = "[0-9０-９一二三四五六七八九十]+";

function toNumber(text: string): number {
  const ascii = text.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  if (/^[0-9]+$/.test(ascii)) {
    return Number(ascii);
  }
  // 十 = 10, 二十 = 20, 十五 = 15
  const [tens, ones] = ascii.includes("十") ? ascii.split("十") : ["", ascii];
  const t = ascii.includes("十") ? (tens ? KANJI[tens] ?? 0 : 1) : 0;
  return t * 10 + (ones ? KANJI[ones] ?? 0 : 0);
}

/** Syrups and concentrates: the number of people depends on how much water goes in, so no count is shown. */
const DILUTE = /シロップ|原液|コーディアル|割って|割ると|混ぜ|濃縮ジュース|倍に/;
/** The catalog says one bottle is one person's. */
const ONE_EACH = /(ひとり|一人)(に)?一本|飲みきれ/;

/** What the catalog's サイズ line says about people, when it says it. */
export function catalogServings(size: string): string | undefined {
  const range = new RegExp(`(${NUM})[、〜～-](${NUM})人`).exec(size);
  if (range) {
    return `${toNumber(range[1])}〜${toNumber(range[2])}人分`;
  }
  const over = new RegExp(`(${NUM})人を超え`).exec(size);
  if (over) {
    return `${toNumber(over[1])}人分以上`;
  }
  const about = new RegExp(`(${NUM})人前後`).exec(size);
  if (about) {
    return `約${toNumber(about[1])}人分`;
  }
  if (ONE_EACH.test(size)) {
    return "ひとり分";
  }
  return undefined;
}

export function servingsText(ml: number, vessel = "", size = "", name = ""): string {
  const dilute = DILUTE.test(name) || DILUTE.test(size);
  const fromCatalog = catalogServings(size);
  if (fromCatalog) {
    return dilute && fromCatalog !== "ひとり分" ? `割って${fromCatalog}` : fromCatalog;
  }
  if (dilute) {
    return "割って飲む";
  }
  if (ml <= SINGLE_ML || (PERSONAL.has(vessel) && ml <= PERSONAL_ML)) {
    return "ひとり分";
  }
  return `約${Math.max(2, Math.round(ml / SHARE_ML))}人分`;
}

/** e.g. ["250ml", "瓶", "ひとり分"] or ["720ml", "大きな瓶", "約4人分"]. Empty when the volume is unknown. */
export function heroSpecs(drink: Pick<Drink, "name" | "size" | "vessel">): string[] {
  const volume = volumeMl(drink);
  if (!volume) {
    return [];
  }
  const vessel = VESSEL[drink.vessel.trim()];
  return [volume.label, ...(vessel ? [vessel] : []), servingsText(volume.ml, drink.vessel.trim(), drink.size, drink.name)];
}
