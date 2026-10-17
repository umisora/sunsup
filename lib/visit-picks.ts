import poolData from "../data/visit-pool.json" with { type: "json" };
import { STORIES, storyById, type Region, type Season, type VisitQuery, type VisitStory, type Weather } from "./visit";

export type ArrivalStand = "full" | "can";

export type PoolFrame = {
  nw: number;
  nh: number;
  l: number;
  t: number;
  cw: number;
  ch: number;
};

export type PoolDrink = {
  slug: string;
  name: string;
  src: string;
  category: string;
  size: string;
  seasons: Season[];
  weather: Weather[];
  region: Region | null;
  generic: boolean;
  vessel: string;
  stand: ArrivalStand;
  frame: PoolFrame;
};

export type PickedDrink = {
  slug: string;
  name: string;
  src: string;
  category: string;
  size: string;
  stand: ArrivalStand;
  frame: PoolFrame;
};

export type PickedStory = {
  id: string;
  drinks: PickedDrink[];
};

const SEASONS: readonly Season[] = ["spring", "summer", "autumn", "winter"];
const WEATHERS: readonly Weather[] = ["hot", "cold", "rain", "mild"];
const REGIONS: readonly Region[] = ["hokkaido", "tohoku", "kanto", "chubu", "kansai", "chugoku", "shikoku", "kyushu", "okinawa"];

function isSeason(value: string): value is Season {
  return (SEASONS as readonly string[]).includes(value);
}

function isWeather(value: string): value is Weather {
  return (WEATHERS as readonly string[]).includes(value);
}

function isRegion(value: string): value is Region {
  return (REGIONS as readonly string[]).includes(value);
}

function isStand(value: string): value is ArrivalStand {
  return value === "full" || value === "can";
}

function readPool(raw: unknown): PoolDrink[] {
  if (!Array.isArray(raw)) {
    throw new Error("visit pool is not a list");
  }
  return raw.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("visit pool row is not an object");
    }
    const row = item as Record<string, unknown>;
    const slug = row.slug;
    const name = row.name;
    const src = row.src;
    const category = row.category;
    const size = row.size;
    const seasons = row.seasons;
    const weather = row.weather;
    const region = row.region;
    const stand = row.stand;
    const frame = row.frame;
    const vessel = row.vessel;
    if (typeof slug !== "string" || typeof name !== "string" || typeof src !== "string") {
      throw new Error("visit pool row is missing its name");
    }
    if (typeof category !== "string" || typeof size !== "string" || typeof row.generic !== "boolean") {
      throw new Error(`visit pool row is incomplete: ${slug}`);
    }
    if (!src.startsWith("/drinks/") || src.includes("fallback-")) {
      throw new Error(`visit pool still is not real: ${slug}`);
    }
    if (!Array.isArray(seasons) || !seasons.every((season) => typeof season === "string" && isSeason(season))) {
      throw new Error(`visit pool seasons are invalid: ${slug}`);
    }
    if (!Array.isArray(weather) || !weather.every((bucket) => typeof bucket === "string" && isWeather(bucket))) {
      throw new Error(`visit pool weather is invalid: ${slug}`);
    }
    if (region !== null && (typeof region !== "string" || !isRegion(region))) {
      throw new Error(`visit pool region is invalid: ${slug}`);
    }
    if (typeof vessel !== "string" || vessel === "") {
      throw new Error(`visit pool vessel is missing: ${slug}`);
    }
    if (typeof stand !== "string" || !isStand(stand)) {
      throw new Error(`visit pool stand is invalid: ${slug}`);
    }
    if (!frame || typeof frame !== "object") {
      throw new Error(`visit pool frame is missing: ${slug}`);
    }
    const box = frame as Record<string, unknown>;
    const numbers = [box.nw, box.nh, box.l, box.t, box.cw, box.ch];
    if (!numbers.every((value) => typeof value === "number" && Number.isFinite(value))) {
      throw new Error(`visit pool frame is invalid: ${slug}`);
    }
    return {
      slug,
      name,
      src,
      category,
      size,
      seasons: seasons as Season[],
      weather: weather as Weather[],
      region: region as Region | null,
      generic: row.generic,
      vessel,
      stand,
      frame: { nw: box.nw as number, nh: box.nh as number, l: box.l as number, t: box.t as number, cw: box.cw as number, ch: box.ch as number },
    };
  });
}

export const VISIT_POOL: readonly PoolDrink[] = readPool(poolData);

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.min(index, Math.floor(random() * (index + 1)));
    const current = next[index];
    const other = next[swap];
    if (current === undefined || other === undefined) {
      continue;
    }
    next[index] = other;
    next[swap] = current;
  }
  return next;
}

function specificity(item: VisitStory): number {
  return (item.region ? 4 : 0) + (item.weather ? 2 : 0) + (item.daypart ? 1 : 0);
}

function matches(item: VisitStory, query: VisitQuery): boolean {
  if (item.season !== query.season) {
    return false;
  }
  if (item.region && item.region !== query.region) {
    return false;
  }
  if (item.weather && item.weather !== query.weather) {
    return false;
  }
  if (item.daypart && item.daypart !== query.daypart) {
    return false;
  }
  return true;
}

function clashesWeatherOrRegion(item: VisitStory, query: VisitQuery): boolean {
  if (item.season !== query.season) {
    return true;
  }
  if (query.weather && item.weather && item.weather !== query.weather) {
    return true;
  }
  if (query.region && item.region && item.region !== query.region) {
    return true;
  }
  return false;
}

/** Two or three stories. The closest matches come first, ties are shuffled. */
export function selectStories(query: VisitQuery, stories: readonly VisitStory[] = STORIES): VisitStory[] {
  const random = query.random ?? Math.random;
  const full = stories.filter((item) => matches(item, query));
  const best = full.reduce((score, item) => Math.max(score, specificity(item)), -1);
  const top = best < 0 ? [] : full.filter((item) => specificity(item) === best);
  let chosen = shuffle(top, random).slice(0, 3);
  if (chosen.length < 2) {
    const wider = stories.filter((item) => !clashesWeatherOrRegion(item, query) && !chosen.some((picked) => picked.id === item.id));
    const groups = new Map<number, VisitStory[]>();
    for (const item of wider) {
      const score = specificity(item);
      const group = groups.get(score) ?? [];
      group.push(item);
      groups.set(score, group);
    }
    const scores = [...groups.keys()].sort((a, b) => b - a);
    for (const score of scores) {
      if (chosen.length >= 3) {
        break;
      }
      for (const item of shuffle(groups.get(score) ?? [], random)) {
        if (chosen.length >= 3) {
          break;
        }
        chosen.push(item);
      }
      if (chosen.length >= 2) {
        break;
      }
    }
  }
  if (query.storyId) {
    const requested = storyById(query.storyId);
    if (requested) {
      chosen = [requested, ...chosen.filter((item) => item.id !== requested.id)].slice(0, 3);
    }
  }
  if (chosen.length === 0) {
    const fallback = storyById("autumn-afternoon") ?? stories[0];
    if (!fallback) {
      throw new Error("visit stories are empty");
    }
    return [fallback];
  }
  return chosen;
}

type FitMode = "strict" | "any-weather" | "any-region" | "versatile";

function eligible(drink: PoolDrink, story: VisitStory, query: VisitQuery, mode: FitMode): boolean {
  const inSeason = drink.seasons.includes(story.season);
  const weather = story.weather ?? query.weather;
  const region = story.region ?? query.region;
  switch (mode) {
    case "strict":
    case "any-weather":
    case "any-region":
      if (!inSeason) {
        return false;
      }
      break;
    case "versatile":
      if (drink.seasons.length > 0 && !inSeason) {
        return false;
      }
      break;
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
  if (mode === "strict" || mode === "any-region") {
    if (weather && !drink.weather.includes(weather)) {
      return false;
    }
  }
  if (mode === "strict" || mode === "any-weather" || mode === "versatile") {
    if (region && drink.region && drink.region !== region) {
      return false;
    }
  }
  return true;
}

function toPicked(drink: PoolDrink): PickedDrink {
  return {
    slug: drink.slug,
    name: drink.name,
    src: drink.src,
    category: drink.category,
    size: drink.size,
    stand: drink.stand,
    frame: drink.frame,
  };
}

function formalBottle(drink: PoolDrink): boolean {
  return drink.vessel === "大瓶" && !drink.name.includes("シロップ");
}

function matchingPool(story: VisitStory, query: VisitQuery, pool: readonly PoolDrink[], used: Set<string>, minimum: number): PoolDrink[] {
  const formal = story.pairing === "formal";
  const source = formal ? pool.filter(formalBottle) : pool;
  const modes: readonly FitMode[] = ["strict", "any-weather", "any-region", "versatile"];
  const genericPasses = formal ? [false] : [false, true];
  for (const allowGeneric of genericPasses) {
    for (const mode of modes) {
      const next = source.filter((drink) => !used.has(drink.slug) && (allowGeneric || !drink.generic) && eligible(drink, story, query, mode));
      if (next.length >= minimum) {
        return next;
      }
    }
  }
  return [];
}

function drawFor(story: VisitStory, query: VisitQuery, pool: readonly PoolDrink[], used: Set<string>, random: () => number): PickedDrink[] {
  const wanted = story.slugs.length >= 3 ? 3 : 2;
  const found = matchingPool(story, query, pool, used, 2);
  if (found.length < 2) {
    return [];
  }
  const featured = shuffle(
    found.filter((drink) => !drink.generic),
    random,
  );
  const generics = shuffle(
    found.filter((drink) => drink.generic),
    random,
  );
  const choices = featured.length >= 2 ? featured : [...featured, ...generics];
  const region = story.region ?? query.region;
  const local = region ? choices.filter((drink) => drink.region === region) : [];
  const lead = local[0];
  const ordered = lead ? [lead, ...shuffle(choices.filter((drink) => drink.slug !== lead.slug), random)] : choices;
  const picked = ordered.slice(0, Math.min(wanted, ordered.length));
  if (picked.length < 2) {
    return [];
  }
  for (const drink of picked) {
    used.add(drink.slug);
  }
  return picked.map(toPicked);
}

/** One more drink for the same story, when a still on the table failed to load. */
export function replacementDrink(
  storyId: string,
  query: VisitQuery,
  avoid: readonly string[],
  pool: readonly PoolDrink[] = VISIT_POOL,
): PickedDrink | undefined {
  const story = storyById(storyId);
  if (!story) {
    return undefined;
  }
  const random = query.random ?? Math.random;
  const found = matchingPool(story, query, pool, new Set(avoid), 1);
  const featured = shuffle(
    found.filter((drink) => !drink.generic),
    random,
  );
  const choice = featured[0] ?? shuffle(found, random)[0];
  return choice ? toPicked(choice) : undefined;
}

/** Per-request drinks for the stories on this page. The same drink is not repeated. */
export function pickVisitStories(query: VisitQuery, pool: readonly PoolDrink[] = VISIT_POOL, stories: readonly VisitStory[] = STORIES): PickedStory[] {
  const random = query.random ?? Math.random;
  const selected = selectStories(query, stories);
  const used = new Set<string>();
  const pages: PickedStory[] = [];
  for (const story of selected) {
    const drinks = drawFor(story, query, pool, used, random);
    if (drinks.length >= 2) {
      pages.push({ id: story.id, drinks });
    }
  }
  if (pages.length > 0) {
    return pages.slice(0, 3);
  }
  const fallback = selected[0];
  if (!fallback) {
    return [];
  }
  const drinks = fallback.slugs.flatMap((slug) => {
    const drink = pool.find((item) => item.slug === slug && !item.generic);
    return drink ? [toPicked(drink)] : [];
  });
  if (drinks.length < 2) {
    return [];
  }
  return [{ id: fallback.id, drinks: drinks.slice(0, 3) }];
}
