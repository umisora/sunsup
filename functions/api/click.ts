import { isGoalKind, isOutKind } from "../../lib/out-links";
import { cleanPath, cleanSlug, jstDay, NO_CONTENT, readBeacon, record, type MetricsContext } from "../../lib/metrics-server";

/** POST {slug, kind, path} when a store link is clicked. Always answers 204. */
export async function onRequestPost(context: MetricsContext): Promise<Response> {
  const db = context.env.METRICS;
  const body = await readBeacon(context.request);
  const slug = cleanSlug(body?.slug);
  const kind = body?.kind;
  const path = cleanPath(body?.path);
  if (!db || !slug || !isOutKind(kind) || !path) {
    return NO_CONTENT();
  }
  const host = new URL(context.request.url).host;
  record(
    context,
    db
      .prepare(
        "INSERT INTO clicks (day, host, slug, kind, goal, path, n) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1) " +
          "ON CONFLICT (day, host, slug, kind, path) DO UPDATE SET n = n + 1",
      )
      .bind(jstDay(new Date()), host, slug, kind, isGoalKind(kind) ? 1 : 0, path)
      .run(),
  );
  return NO_CONTENT();
}
