-- 0002: keep where a store click came from. source is 'page' (the drink page's store row)
-- or 'list' (a scene page's shopping list). Existing rows are all drink-page clicks.
-- Run after the code that writes source is deployed; functions/api/click.ts falls back to the
-- old insert until then.
CREATE TABLE clicks_new (
  day TEXT NOT NULL,
  host TEXT NOT NULL,
  slug TEXT NOT NULL,
  kind TEXT NOT NULL,
  goal INTEGER NOT NULL,
  path TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'page',
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, host, slug, kind, path, source)
);
INSERT INTO clicks_new (day, host, slug, kind, goal, path, source, n)
  SELECT day, host, slug, kind, goal, path, 'page', n FROM clicks;
DROP TABLE clicks;
ALTER TABLE clicks_new RENAME TO clicks;
