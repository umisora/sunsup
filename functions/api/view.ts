import { cleanPath, drinkSlugOf, jstDay, NO_CONTENT, readBeacon, record, type MetricsContext } from "../../lib/metrics-server";

/** POST {path} once per page shown in a browser. Always answers 204. */
export async function onRequestPost(context: MetricsContext): Promise<Response> {
  const db = context.env.METRICS;
  const body = await readBeacon(context.request);
  const path = cleanPath(body?.path);
  if (!db || !path) {
    return NO_CONTENT();
  }
  const host = new URL(context.request.url).host;
  record(
    context,
    db
      .prepare(
        "INSERT INTO views (day, host, path, slug, n) VALUES (?1, ?2, ?3, ?4, 1) " +
          "ON CONFLICT (day, host, path) DO UPDATE SET n = n + 1",
      )
      .bind(jstDay(new Date()), host, path, drinkSlugOf(path))
      .run(),
  );
  return NO_CONTENT();
}
