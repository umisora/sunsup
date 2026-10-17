import { pickVisitStories } from "../../lib/visit-picks";
import { daypartOf, regionFromCf, seasonOf, weatherBucket, type Weather } from "../../lib/visit";

type CfGeo = {
  region?: string;
  regionCode?: string;
  country?: string;
  latitude?: string | number;
  longitude?: string | number;
  timezone?: string;
};

type PagesContext = {
  request: Request & { cf?: CfGeo };
};

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "private, no-store",
  "cdn-cache-control": "no-store",
};

function finiteCoord(value: string | number | undefined): number | undefined {
  const coord = Number(value);
  if (!Number.isFinite(coord)) {
    return undefined;
  }
  return coord;
}

/** Open-Meteo needs no key. Coordinates are rounded and not logged or stored. */
async function weatherFromCf(cf: CfGeo | undefined): Promise<Weather | undefined> {
  const lat = finiteCoord(cf?.latitude);
  const lon = finiteCoord(cf?.longitude);
  if (lat === undefined || lon === undefined) {
    return undefined;
  }
  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.searchParams.set("latitude", (Math.round(lat * 100) / 100).toFixed(2));
  endpoint.searchParams.set("longitude", (Math.round(lon * 100) / 100).toFixed(2));
  endpoint.searchParams.set("current", "temperature_2m,precipitation,weather_code");
  endpoint.searchParams.set("timezone", "Asia/Tokyo");
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(1200) });
    if (!response.ok) {
      return undefined;
    }
    const body = (await response.json()) as {
      current?: { temperature_2m?: unknown; precipitation?: unknown; weather_code?: unknown };
    };
    const temperature = body.current?.temperature_2m;
    const precipitation = body.current?.precipitation;
    const code = body.current?.weather_code;
    if (typeof temperature !== "number" || typeof precipitation !== "number" || typeof code !== "number") {
      return undefined;
    }
    return weatherBucket(temperature, precipitation, code);
  } catch {
    return undefined;
  }
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const url = new URL(context.request.url);
  const requested = url.searchParams.get("story") ?? undefined;
  const now = new Date();
  const cf = context.request.cf;
  const weather = await weatherFromCf(cf);
  const region = regionFromCf(cf?.country, cf?.region, cf?.regionCode);
  const daypart = daypartOf(now, cf?.timezone || "Asia/Tokyo");
  const season = seasonOf(now);
  const stories = pickVisitStories({
    season,
    daypart,
    weather,
    region,
    storyId: requested,
    random: Math.random,
  });

  console.log(
    JSON.stringify({
      visit: stories.map((item) => item.id),
      drinks: stories.map((item) => item.drinks.map((drink) => drink.slug)),
      weather: weather ?? "unknown",
      region: region ?? "unknown",
    }),
  );

  return new Response(
    JSON.stringify({
      season,
      daypart,
      weather: weather ?? null,
      region: region ?? null,
      stories: stories.map((item) => ({
        id: item.id,
        drinks: item.drinks.map((drink) => ({
          slug: drink.slug,
          name: drink.name,
          src: drink.src,
          category: drink.category,
          size: drink.size,
          stand: drink.stand,
          frame: drink.frame,
        })),
      })),
    }),
    { headers: JSON_HEADERS },
  );
}
