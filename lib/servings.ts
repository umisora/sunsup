/**
 * Short facts for the first screen of a drink page: volume, container, and how many people one bottle serves.
 * Read from the name and the サイズ line; nothing is guessed when neither says a volume.
 */
import type { Drink } from "./drinks";

const VOLUME = /(\d+(?:\.\d+)?)\s*(ml|mL|ML|ｍｌ|L|ℓ|g)(?![a-zA-Z])/;

/** One person drinks about this much at an after-work table. */
const SHARE_ML = 150;
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

export function servingsText(ml: number, vessel = ""): string {
  if (ml <= SINGLE_ML || (PERSONAL.has(vessel) && ml <= PERSONAL_ML)) {
    return "ひとり分";
  }
  return `約${Math.max(2, Math.round(ml / SHARE_ML))}人分`;
}

/** e.g. ["250ml", "瓶", "ひとり分"] or ["720ml", "瓶", "約5人分"]. Empty when the volume is unknown. */
export function heroSpecs(drink: Pick<Drink, "name" | "size" | "vessel">): string[] {
  const volume = volumeMl(drink);
  if (!volume) {
    return [];
  }
  const vessel = VESSEL[drink.vessel.trim()];
  return [volume.label, ...(vessel ? [vessel] : []), servingsText(volume.ml, drink.vessel.trim())];
}
