#!/usr/bin/env node
// Reads the first-party counters in D1 (stylish-metrics) and prints clicks and views.
//
//   CLOUDFLARE_API_TOKEN=... node scripts/metrics-report.mjs [--from 2026-10-01] [--to 2026-10-31] [--host stylish.sunsup.me] [--json]
//
// The token needs "D1: Read" on account 710c24e2f98959d716cd2fc1491bcd3c.
// Goal clicks = Amazon, 楽天, 公式ショップ (direct) and その他の通販 (other). 公式 (brand site) is counted apart.
// Days are calendar days in Japan (JST).

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID ?? "710c24e2f98959d716cd2fc1491bcd3c";
const DATABASE = process.env.METRICS_DB_ID ?? "b70ae683-87b7-414c-ba57-d4cda9ce8c46";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const GOAL_PER_MONTH = 5000;

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 && args[at + 1] ? args[at + 1] : fallback;
};
const jstToday = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const from = flag("from", `${jstToday.slice(0, 7)}-01`);
const to = flag("to", jstToday);
const host = flag("host", "stylish.sunsup.me");
const asJson = args.includes("--json");

if (!TOKEN) {
  console.error("CLOUDFLARE_API_TOKEN is not set. The same SQL is in docs/metrics.md for the dashboard or wrangler.");
  process.exit(1);
}

export const QUERIES = {
  totals: `SELECT SUM(CASE WHEN goal = 1 THEN n ELSE 0 END) AS goal_clicks,
                  SUM(CASE WHEN goal = 0 THEN n ELSE 0 END) AS official_clicks
           FROM clicks WHERE host = ?1 AND day BETWEEN ?2 AND ?3`,
  views: `SELECT SUM(n) AS page_views, SUM(CASE WHEN slug <> '' THEN n ELSE 0 END) AS drink_page_views
          FROM views WHERE host = ?1 AND day BETWEEN ?2 AND ?3`,
  byDay: `SELECT day, SUM(CASE WHEN goal = 1 THEN n ELSE 0 END) AS goal_clicks,
                 SUM(CASE WHEN goal = 0 THEN n ELSE 0 END) AS official_clicks
          FROM clicks WHERE host = ?1 AND day BETWEEN ?2 AND ?3 GROUP BY day ORDER BY day`,
  byWeek: `SELECT strftime('%Y-W%W', day) AS week, SUM(CASE WHEN goal = 1 THEN n ELSE 0 END) AS goal_clicks,
                  SUM(CASE WHEN goal = 0 THEN n ELSE 0 END) AS official_clicks
           FROM clicks WHERE host = ?1 AND day BETWEEN ?2 AND ?3 GROUP BY week ORDER BY week`,
  byMonth: `SELECT substr(day, 1, 7) AS month, SUM(CASE WHEN goal = 1 THEN n ELSE 0 END) AS goal_clicks,
                   SUM(CASE WHEN goal = 0 THEN n ELSE 0 END) AS official_clicks
            FROM clicks WHERE host = ?1 AND day BETWEEN ?2 AND ?3 GROUP BY month ORDER BY month`,
  byKind: `SELECT kind, goal, SUM(n) AS clicks FROM clicks
           WHERE host = ?1 AND day BETWEEN ?2 AND ?3 GROUP BY kind, goal ORDER BY clicks DESC`,
  bySource: `SELECT source, SUM(CASE WHEN goal = 1 THEN n ELSE 0 END) AS goal_clicks,
                    SUM(CASE WHEN goal = 0 THEN n ELSE 0 END) AS official_clicks
             FROM clicks WHERE host = ?1 AND day BETWEEN ?2 AND ?3 GROUP BY source ORDER BY goal_clicks DESC`,
  byDrink: `WITH c AS (
              SELECT slug, SUM(CASE WHEN goal = 1 THEN n ELSE 0 END) AS goal_clicks,
                     SUM(CASE WHEN goal = 0 THEN n ELSE 0 END) AS official_clicks
              FROM clicks WHERE host = ?1 AND day BETWEEN ?2 AND ?3 GROUP BY slug),
            v AS (
              SELECT slug, SUM(n) AS views FROM views
              WHERE host = ?1 AND day BETWEEN ?2 AND ?3 AND slug <> '' GROUP BY slug)
            SELECT v.slug, v.views, COALESCE(c.goal_clicks, 0) AS goal_clicks, COALESCE(c.official_clicks, 0) AS official_clicks,
                   ROUND(100.0 * COALESCE(c.goal_clicks, 0) / v.views, 1) AS goal_rate_pct
            FROM v LEFT JOIN c ON c.slug = v.slug
            UNION ALL
            SELECT c.slug, 0, c.goal_clicks, c.official_clicks, NULL FROM c WHERE c.slug NOT IN (SELECT slug FROM v)
            ORDER BY goal_clicks DESC, views DESC LIMIT 50`,
};

async function query(sql) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DATABASE}/query`, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ sql, params: [host, from, to] }),
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(JSON.stringify(body.errors));
  }
  return body.result[0].results;
}

const report = {};
for (const [name, sql] of Object.entries(QUERIES)) {
  report[name] = await query(sql);
}

if (asJson) {
  console.log(JSON.stringify({ host, from, to, ...report }, null, 2));
} else {
  const goal = report.totals[0]?.goal_clicks ?? 0;
  const official = report.totals[0]?.official_clicks ?? 0;
  const views = report.views[0]?.page_views ?? 0;
  const drinkViews = report.views[0]?.drink_page_views ?? 0;
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
  const pace = days > 0 ? Math.round((goal / days) * 30) : 0;
  console.log(`${host}  ${from} 〜 ${to}（JST, ${days}日）`);
  console.log(`  商品リンクのクリック（目標に数える）: ${goal}`);
  console.log(`  公式サイトのクリック（別に数える）  : ${official}`);
  console.log(`  ページビュー（ブラウザで開かれた数）: ${views}（うちドリンクのページ ${drinkViews}）`);
  console.log(`  商品リンクのクリック率: ${drinkViews ? ((100 * goal) / drinkViews).toFixed(1) : "-"}%（ドリンクのページ1回あたり）`);
  console.log(`  30日換算: ${pace} / 目標 ${GOAL_PER_MONTH}（あと ${Math.max(0, GOAL_PER_MONTH - pace)}）`);
  for (const name of ["byMonth", "byWeek", "byDay", "byKind", "bySource", "byDrink"]) {
    console.log(`\n[${name}]`);
    console.table(report[name]);
  }
}
