/**
 * First-party, cookieless counters for page views and store clicks (Pages Functions only).
 * One row per day × page (× drink × link type) with a running count. No IP, no user agent,
 * no identifier is stored. Clicks also keep where they came from (source: page or list). Requests that fail validation still get 204 so the page never notices.
 */

type D1Statement = { bind(...values: unknown[]): { run(): Promise<unknown> } };
export type D1Like = { prepare(sql: string): D1Statement };

export type MetricsContext = {
  request: Request;
  env: { METRICS?: D1Like };
  waitUntil?: (promise: Promise<unknown>) => void;
};

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|googleother|facebookexternalhit|meta-externalagent|bingpreview/i;
const PATH = /^\/[a-z0-9\-/]{0,120}$/;
const SLUG = /^[a-z0-9-]{1,80}$/;
const MAX_BODY = 512;

export const NO_CONTENT = () =>
  new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

/** Calendar day in Japan, since the site and its readers are in Japan. */
export function jstDay(now: Date): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function cleanPath(value: unknown): string | undefined {
  return typeof value === "string" && PATH.test(value) ? value : undefined;
}

export function cleanSlug(value: unknown): string | undefined {
  return typeof value === "string" && SLUG.test(value) ? value : undefined;
}

/** Where a store click came from: the drink page's store row, or a scene page's shopping list. */
export const CLICK_SOURCES = ["page", "list"] as const;
export type ClickSource = (typeof CLICK_SOURCES)[number];

export function cleanSource(value: unknown): ClickSource {
  return typeof value === "string" && (CLICK_SOURCES as readonly string[]).includes(value) ? (value as ClickSource) : "page";
}

export function drinkSlugOf(path: string): string {
  const match = /^\/drink\/([a-z0-9-]+)\/$/.exec(path);
  return match?.[1] ?? "";
}

/** Same-origin browser beacons only. Crawlers and cross-site posts are dropped. */
export async function readBeacon(request: Request): Promise<Record<string, unknown> | undefined> {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (!origin) {
    return undefined;
  }
  try {
    if (new URL(origin).host !== url.host) {
      return undefined;
    }
  } catch {
    return undefined;
  }
  if (BOT.test(request.headers.get("user-agent") ?? "")) {
    return undefined;
  }
  const text = await request.text();
  if (text.length === 0 || text.length > MAX_BODY) {
    return undefined;
  }
  try {
    const body: unknown = JSON.parse(text);
    return body && typeof body === "object" ? (body as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

export function record(context: MetricsContext, write: Promise<unknown>): void {
  const safe = write.catch(() => undefined);
  if (context.waitUntil) {
    context.waitUntil(safe);
  }
}
