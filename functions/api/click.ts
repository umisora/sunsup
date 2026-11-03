import { isGoalKind, isOutKind } from "../../lib/out-links";
import { cleanPath, cleanSlug, cleanSource, jstDay, NO_CONTENT, readBeacon, record, type MetricsContext } from "../../lib/metrics-server";

const WITH_SOURCE =
  "INSERT INTO clicks (day, host, slug, kind, goal, path, source, n) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1) " +
  "ON CONFLICT (day, host, slug, kind, path, source) DO UPDATE SET n = n + 1";
/** Until docs/metrics-migrations/0002-clicks-source.sql has run, the table has no source column. */
const WITHOUT_SOURCE =
  "INSERT INTO clicks (day, host, slug, kind, goal, path, n) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1) " +
  "ON CONFLICT (day, host, slug, kind, path) DO UPDATE SET n = n + 1";

/** POST {slug, kind, path, source} when a store link is clicked. Always answers 204. */
export async function onRequestPost(context: MetricsContext): Promise<Response> {
  const db = context.env.METRICS;
  const body = await readBeacon(context.request);
  const slug = cleanSlug(body?.slug);
  const kind = body?.kind;
  const path = cleanPath(body?.path);
  if (!db || !slug || !isOutKind(kind) || !path) {
    return NO_CONTENT();
  }
  const source = cleanSource(body?.source);
  const host = new URL(context.request.url).host;
  const day = jstDay(new Date());
  const goal = isGoalKind(kind) ? 1 : 0;
  record(
    context,
    db
      .prepare(WITH_SOURCE)
      .bind(day, host, slug, kind, goal, path, source)
      .run()
      .catch(() => db.prepare(WITHOUT_SOURCE).bind(day, host, slug, kind, goal, path).run()),
  );
  return NO_CONTENT();
}
