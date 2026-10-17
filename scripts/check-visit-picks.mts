import { pickVisitStories, VISIT_POOL } from "../lib/visit-picks.ts";
import type { VisitQuery } from "../lib/visit.ts";

const bySlug = new Map(VISIT_POOL.map((drink) => [drink.slug, drink]));

const failures: string[] = [];

function fail(message: string) {
  failures.push(message);
}

function randomFrom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function pages(query: VisitQuery, seed: number) {
  return pickVisitStories({ ...query, random: randomFrom(seed) });
}

const heroSets = new Set<string>();
const seenSlugs = new Set<string>();
for (let seed = 1; seed <= 24; seed += 1) {
  const stories = pages({ season: "autumn", daypart: "morning" }, seed);
  if (stories.length < 2 || stories.length > 3) {
    fail(`autumn morning produced ${stories.length} stories`);
  }
  const slugs = stories.flatMap((story) => story.drinks.map((drink) => drink.slug));
  if (new Set(slugs).size !== slugs.length) {
    fail(`autumn morning repeated a drink: ${slugs.join(",")}`);
  }
  for (const story of stories) {
    if (story.drinks.length < 2 || story.drinks.length > 3) {
      fail(`${story.id} has ${story.drinks.length} drinks`);
    }
    for (const drink of story.drinks) {
      const row = bySlug.get(drink.slug);
      if (!row) {
        fail(`featured a drink outside the pool: ${drink.slug}`);
      } else if (row.generic) {
        fail(`featured a convenience-store staple: ${drink.slug}`);
      }
      if (!drink.src.startsWith("/drinks/") || drink.src.includes("fallback-")) {
        fail(`featured a fallback still: ${drink.slug}`);
      }
      seenSlugs.add(drink.slug);
    }
  }
  const hero = stories[0];
  if (hero) {
    heroSets.add(hero.drinks.map((drink) => drink.slug).join("|"));
  }
}

if (heroSets.size < 8) {
  fail(`autumn morning hero only produced ${heroSets.size} drink sets`);
}
if (seenSlugs.size < 12) {
  fail(`autumn morning only used ${seenSlugs.size} drinks`);
}

for (let seed = 1; seed <= 12; seed += 1) {
  const stories = pages({ season: "summer", weather: "hot", region: "okinawa", daypart: "afternoon" }, seed);
  for (const story of stories) {
    for (const drink of story.drinks) {
      const row = bySlug.get(drink.slug);
      if (!row) {
        fail(`okinawa visit missing pool row ${drink.slug}`);
        continue;
      }
      if (row.region && row.region !== "okinawa") {
        fail(`okinawa visit included ${row.region} drink ${drink.slug}`);
      }
      if (row.generic) {
        fail(`okinawa visit featured ${drink.slug}`);
      }
    }
  }
  const local = stories.some((story) => story.drinks.some((drink) => bySlug.get(drink.slug)?.region === "okinawa"));
  if (!local) {
    fail(`okinawa visit had no Okinawa drink on seed ${seed}`);
  }
}

const first = pages({ season: "winter", weather: "cold", region: "hokkaido", daypart: "evening" }, 3);
const second = pages({ season: "winter", weather: "cold", region: "hokkaido", daypart: "evening" }, 9);
const firstKey = first.map((story) => story.drinks.map((drink) => drink.slug).join(",")).join("/");
const secondKey = second.map((story) => story.drinks.map((drink) => drink.slug).join(",")).join("/");
if (firstKey === secondKey) {
  fail("two winter visits picked the same drinks");
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(message);
  }
  process.exit(1);
}

console.log(`visit picks ok: ${heroSets.size} autumn hero sets, ${seenSlugs.size} drinks`);
