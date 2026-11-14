// Checks the exported scene pages under /ba/<slug>/ (run after `npm run build`).
// Listed drinks must be public with a real still, the ItemList must match the links on the page,
// the breadcrumbs must end at the page, the page must be in the sitemap, and each drink must link back.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const failures = [];
const fail = (message) => failures.push(message);
const read = (path) => readFileSync(join("out", path), "utf8");

const sitemap = `${read("sitemap-pages.xml")}\n${read("sitemap-drinks.xml")}`;
const origin = (read("robots.txt").match(/Sitemap: (https:\/\/[^/]+)\//) ?? [])[1] ?? "";
const scenes = readdirSync(join("out", "ba"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "office")
  .map((entry) => entry.name);

if (scenes.length === 0) {
  fail("no scene pages under out/ba/");
}

for (const slug of scenes) {
  const path = `/ba/${slug}/`;
  const html = read(`ba/${slug}/index.html`);
  const url = `${origin}${path}`;
  if (!html.includes(`<link rel="canonical" href="${url}"/>`)) {
    fail(`${path} is missing its canonical`);
  }
  if (!sitemap.includes(`<loc>${url}</loc>`)) {
    fail(`${path} is not in the sitemap`);
  }
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const list = blocks.find((item) => item["@type"] === "ItemList");
  const crumbs = blocks.find((item) => item["@type"] === "BreadcrumbList");
  if (!list || !crumbs || blocks.some((item) => item["@context"] !== "https://schema.org")) {
    fail(`${path} needs an ItemList and a BreadcrumbList on https://schema.org`);
    continue;
  }
  if (crumbs.itemListElement.at(-1)?.item !== url) {
    fail(`${path} breadcrumbs do not end at the page`);
  }
  const linked = [...new Set([...html.matchAll(/href="\/drink\/([a-z0-9-]+)\/"/g)].map((m) => m[1]))];
  const listed = list.itemListElement.map((item, index) => {
    if (item["@type"] !== "ListItem" || item.position !== index + 1) {
      fail(`${path} ItemList entry ${index + 1} is not a numbered ListItem`);
    }
    return item.url.replace(`${origin}/drink/`, "").replace(/\/$/, "");
  });
  if (list.numberOfItems !== listed.length || listed.length < 6) {
    fail(`${path} ItemList has ${listed.length} drinks`);
  }
  for (const drink of listed) {
    const page = join("out", "drink", drink, "index.html");
    if (!existsSync(page)) {
      fail(`${path} lists ${drink}, which has no public page`);
      continue;
    }
    if (!linked.includes(drink)) {
      fail(`${path} ItemList has ${drink} but the page does not link it`);
    }
    const drinkHtml = readFileSync(page, "utf8");
    if (!drinkHtml.includes(`href="${path}"`)) {
      fail(`/drink/${drink}/ does not link back to ${path}`);
    }
    const still = drinkHtml.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? "";
    if (!still.includes("/drinks/") || still.includes("fallback")) {
      fail(`${path} lists ${drink} without a real still`);
    }
  }
}

// A scene hero made from product stills: every drink in it is on that page, and no print pixel was repainted.
const fidelityPath = join(process.cwd(), "stills", "scene-hero-fidelity.json");
if (existsSync(fidelityPath)) {
  const fidelity = JSON.parse(readFileSync(fidelityPath, "utf8"));
  for (const [scene, drinks] of Object.entries(fidelity)) {
    const page = join("out", "ba", scene, "index.html");
    const html = existsSync(page) ? readFileSync(page, "utf8") : "";
    for (const [drink, result] of Object.entries(drinks)) {
      if (!html.includes(`href="/drink/${drink}/"`)) {
        fail(`hero of /ba/${scene}/ shows ${drink}, which the page does not list`);
      }
      if (result.print_maxdiff !== 0) {
        fail(`hero of /ba/${scene}/ repainted the print of ${drink}`);
      }
    }
  }
}

// STYLISH!'s recommended set, first painted for 4 people toasting with a soft drink: the tag and the
// shared heading 「乾杯のソフトドリンクは、この3種類で」 (bonenkai alone sets its own listHeading),
// three role cards (乾杯用 4本, テーブル用 1本, 食事用 1本 = 6本)
// each with a reason, the drink page's own store links (same URL, same kind) tagged source=list with no
// affiliate parameters and swap buttons for the other drinks of the role, then 「全部で6本」 and the LINE link.
const AFFILIATE = /[?&](tag|ascsubtag|linkCode|aff(iliate)?(_?id)?|scid|a8|afid)=/i;
const unescape = (text) => text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attr = (tag, name) => {
  const match = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return match ? unescape(match[1]) : undefined;
};
const strip = (text) => unescape(text.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, ""));
const times = (haystack, needle) => {
  if (needle.length === 0) {
    return 0;
  }
  let count = 0;
  let from = 0;
  while (from <= haystack.length) {
    const index = haystack.indexOf(needle, from);
    if (index < 0) {
      break;
    }
    count += 1;
    from = index + needle.length;
  }
  return count;
};

// Approved bonenkai copy, outside scripts, in the element that owns it.
function checkBonenkaiCopy(html, path) {
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const once = (label, needle) => {
    const count = times(visible, needle);
    if (count !== 1) {
      fail(`${path} ${label} occurs ${count} times outside scripts`);
    }
  };
  const metaTitle = "忘年会のノンアルコール、何を何本？ 乾杯から料理まで";
  const description =
    "忘年会のノンアルコールは、10人なら13本が目安です。乾杯用に小さな瓶をひとり1本、あとはテーブルで注ぎ分ける大きな瓶と、料理に合う甘さ控えめの瓶をそろえます。人数ごとの本数表つきで、買い出しリストはそのままLINEで送れます。";
  const h1Text = "忘年会のノンアル、乾杯の一本から";
  const lead =
    "乾杯は小さな瓶でひとり1本。テーブルには大きな瓶を置いて注ぎ分け、料理が進んだら甘さ控えめの瓶を開けます。ソフトドリンクで乾杯する人が10人なら、あわせて13本が目安です。";
  const smallHeading = "乾杯の飲み物は、ひとり1本の小さな瓶で";
  const caption = "何人で何本？ ノンアルの本数早見表";
  const note =
    "小さな瓶はひとり1本、大きな瓶は5人に1本、食事用は10人に1本（端数は切り上げ）。水やお茶は数に入れていない、STYLISH!の目安です。";
  if (!html.includes(`<title>${metaTitle}｜STYLISH!</title>`)) {
    fail(`${path} title is not the approved meta title`);
  }
  if (!html.includes(`<meta name="description" content="${description}"/>`)) {
    fail(`${path} meta description is not the approved sentence`);
  }
  const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html);
  if (!h1 || strip(h1[1]) !== h1Text || times(html, "<h1") !== 1) {
    fail(`${path} h1: ${h1 ? strip(h1[1]) : "missing"}`);
  }
  once("lead", lead);
  once("small-bottle heading", smallHeading);
  once("list heading", "人数を入れて、飲み物の量と買うものを決める");
  once("table caption", caption);
  once("table note", note);
  const dry = visible.indexOf('id="group-dry"');
  const tableAt = visible.indexOf(caption);
  const listAt = visible.indexOf('id="list"');
  const listHeadingAt = visible.indexOf("人数を入れて、飲み物の量と買うものを決める");
  if (!(dry >= 0 && tableAt > dry && listAt > tableAt && listHeadingAt > listAt)) {
    fail(`${path} count table is not between 甘くない一本 and the list heading`);
  }
  if (visible.indexOf("<table") > listAt || visible.indexOf('data-shopping-list=""') < tableAt) {
    fail(`${path} count table is inside the shopping list or only after it`);
  }
  const headers = [...visible.matchAll(/<th\b[^>]*\bscope="col"[^>]*>([\s\S]*?)<\/th>/g)].map((cell) => strip(cell[1]));
  if (headers.join("|") !== "ソフトドリンクで乾杯する人|合計|小さな瓶|大きな瓶|甘さ控えめ") {
    fail(`${path} count table headers: ${headers.join("|") || "missing"}`);
  }
  const rows = [...visible.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
    .slice(1)
    .map((row) => [...row[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/g)].map((cell) => strip(cell[1])).join("|"));
  const expectedRows = ["5人|7本|5|1|1", "10人|13本|10|2|1", "20人|26本|20|4|2", "30人|39本|30|6|3"];
  if (rows.join() !== expectedRows.join()) {
    fail(`${path} count table rows: ${rows.join() || "missing"}`);
  }
}

// Company party and farewell use the same bottle rows as bonenkai. Words differ; numbers do not.
const ADDED_COUNT_TABLES = {
  kaisha: {
    title: "定時後の乾杯、ソフトドリンクは何本？",
    headingId: "kaisha-bottle-counts",
    note: "乾杯の瓶はひとり1本、大きな瓶は5人に1本、食事用は10人に1本（端数は切り上げ）。STYLISH!の目安です。",
  },
  kansougeikai: {
    title: "全員で乾杯するなら、何本？",
    headingId: "kansougeikai-bottle-counts",
    note: "乾杯の瓶はひとり1本、大きな瓶は5人に1本、食事用は10人に1本（端数は切り上げ）。主役に渡す一本は、別に足してください。STYLISH!の目安です。",
  },
};
function checkAddedCountTable(html, path, slug) {
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const copy = ADDED_COUNT_TABLES[slug];
  const tableMatch = /<table\b[\s\S]*?<\/table>/.exec(visible);
  if (!tableMatch || (visible.match(/<table\b/g) ?? []).length !== 1) {
    fail(`${path} count table: ${(visible.match(/<table\b/g) ?? []).length} table(s)`);
    return;
  }
  const table = tableMatch[0];
  if (/<a\b/i.test(table)) {
    fail(`${path} count table contains a link`);
  }
  const caption = /<caption\b([^>]*)>([\s\S]*?)<\/caption>/.exec(table);
  const captionId = caption ? attr(`<caption${caption[1]}>`, "id") : undefined;
  if (!caption || strip(caption[2]) !== copy.title || captionId !== copy.headingId) {
    fail(`${path} count table caption: ${caption ? `${captionId ?? ""} ${strip(caption[2])}` : "missing"}`);
  }
  const headers = [...table.matchAll(/<th\b[^>]*\bscope="col"[^>]*>([\s\S]*?)<\/th>/g)].map((cell) => strip(cell[1]));
  if (headers.join("|") !== "ソフトドリンクで乾杯する人|合計|乾杯の瓶|大きな瓶|食事用") {
    fail(`${path} count table headers: ${headers.join("|") || "missing"}`);
  }
  if (headers[4] !== "食事用") {
    fail(`${path} third breakdown label is ${headers[4] ?? "missing"}, not 食事用`);
  }
  const tableEnd = visible.indexOf(table) + table.length;
  const noteEnd = visible.indexOf("</p>", tableEnd);
  const block = noteEnd < 0 ? table : visible.slice(visible.indexOf(table), noteEnd + 4);
  if (block.includes("甘さ控えめ") || block.includes("砂糖なし")) {
    fail(`${path} count table contains 甘さ控えめ or 砂糖なし`);
  }
  const rows = [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
    .slice(1)
    .map((row) => [...row[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/g)].map((cell) => strip(cell[1])).join("|"));
  const expectedRows = ["5人|7本|5|1|1", "10人|13本|10|2|1", "20人|26本|20|4|2", "30人|39本|30|6|3"];
  if (rows.join() !== expectedRows.join()) {
    fail(`${path} count table rows: ${rows.join() || "missing"}`);
  }
  const note = /<p\b[^>]*>([\s\S]*?)<\/p>/.exec(visible.slice(tableEnd));
  if (!note || strip(note[1]) !== copy.note) {
    fail(`${path} count table note: ${note ? strip(note[1]) : "missing"}`);
  }
  const tableAt = visible.indexOf(table);
  const sectionClose = visible.indexOf("</section>", tableAt);
  const nextSection = visible.indexOf("<section", sectionClose);
  const listSection = visible.indexOf('<section id="list"');
  if (sectionClose < 0 || nextSection !== listSection || visible.indexOf('data-shopping-list=""') < tableAt) {
    fail(`${path} count table is not directly above the recommended list`);
  }
  if (!visible.includes(`aria-labelledby="${copy.headingId}"`)) {
    fail(`${path} count table section is not labelled by ${copy.headingId}`);
  }
}
const ROLES = [
  ["kanpai", "乾杯用", 4],
  ["table", "テーブル用", 1],
  ["meal", "食事用", 1],
];
for (const slug of scenes) {
  const path = `/ba/${slug}/`;
  const html = read(`ba/${slug}/index.html`);
  const start = html.indexOf('data-shopping-list=""');
  if (start < 0 || !html.includes('id="list"') || !/<a href="#list"[^>]*>ソフトドリンクのおすすめを見る/.test(html)) {
    fail(`${path} has no recommended set, or no ソフトドリンクのおすすめを見る link to it`);
    continue;
  }
  if (!/data-shopping-list="" data-headcount="4"/.test(html)) {
    fail(`${path} set is not first painted for 4 people`);
  }
  if (/data-store-emphasis="true"/.test(html) !== (slug === "bonenkai")) {
    fail(`${path} store emphasis is ${slug === "bonenkai" ? "missing" : "set"}; only bonenkai draws shop links as actions`);
  }
  const part = html.slice(start);
  if (!/<p class="[^"]*">STYLISH!のおすすめ<\/p>/.test(part)) {
    fail(`${path} set has no STYLISH!のおすすめ tag`);
  }
  // listHeading is allowed on bonenkai only. Any other scene that sets one fails here,
  // because its exported h2 would no longer be the shared heading.
  const expectedHeading = slug === "bonenkai" ? "人数を入れて、飲み物の量と買うものを決める" : "乾杯のソフトドリンクは、この3種類で";
  const heading = /<h2 id="list-title"[^>]*>([\s\S]*?)<\/h2>/.exec(part);
  if (!heading || strip(heading[1]) !== expectedHeading) {
    fail(`${path} set heading: ${heading ? strip(heading[1]) : "missing"}`);
  }
  if (slug !== "bonenkai" && html.includes("人数を入れて、飲み物の量と買うものを決める")) {
    fail(`${path} uses the bonenkai list heading`);
  }
  if (slug === "bonenkai") {
    checkBonenkaiCopy(html, path);
  } else if (slug === "kaisha" || slug === "kansougeikai") {
    checkAddedCountTable(html, path, slug);
  } else if (html.includes("<caption") || /<table\b/.test(html)) {
    fail(`${path} has a count table; only bonenkai, kaisha, and kansougeikai do`);
  }
  if (!part.includes(">ソフトドリンクで乾杯する人</span>")) {
    fail(`${path} set has no ソフトドリンクで乾杯する人 headcount`);
  }
  const cards = [...part.matchAll(/<li class="[^"]*" data-list-role="([a-z]+)" data-list-slug="([a-z0-9-]+)" data-units="(\d+)">([\s\S]*?)(?=<li class="[^"]*" data-list-role=|<p class="[^"]*" data-total=)/g)];
  if (cards.map((card) => card[1]).join() !== ROLES.map((role) => role[0]).join()) {
    fail(`${path} set cards are ${cards.map((card) => card[1]).join() || "missing"}, not kanpai,table,meal`);
  }
  let total = 0;
  const sent = [];
  for (const [, role, drink, units, body] of cards) {
    const [, label, expected] = ROLES.find((entry) => entry[0] === role) ?? [];
    if (Number(units) !== expected || !body.includes(`>${units}</span>`)) {
      fail(`${path} set: ${role} is ${units} bottles for 4 people, expected ${expected}`);
    }
    total += Number(units);
    if (!body.includes(`>${label}</span>`) || !/<p class="[^"]*">[^<]{6,}。<\/p>/.test(body)) {
      fail(`${path} set: ${role} card has no ${label} tag or no reason`);
    }
    if (!/<img src="\/drinks\/[a-z0-9-]+\.webp"/.test(body)) {
      fail(`${path} set: ${drink} card has no still`);
    }
    const swaps = [...body.matchAll(/<button[^>]*data-list-swap="([a-z0-9-]+)"[^>]*>/g)];
    if (swaps.length < 2 || !swaps.some((tag) => tag[1] === drink && /aria-pressed="true"/.test(tag[0]) && /\sdisabled=""/.test(tag[0])) || !swaps.every((tag) => /aria-label="[^"]+に替える"/.test(tag[0]))) {
      fail(`${path} set: ${role} has ${swaps.length} swap button(s), or the pick is not marked pressed`);
    }
    if (!/>ほかの候補<\/span>/.test(body)) {
      fail(`${path} set: ${role} has no ほかの候補`);
    }
    const drinkPage = join("out", "drink", drink, "index.html");
    if (!existsSync(drinkPage)) {
      fail(`${path} set names ${drink}, which has no drink page`);
    }
    const map = existsSync(drinkPage) ? JSON.parse((readFileSync(drinkPage, "utf8").match(/<script[^>]*id="out-links"[^>]*>([\s\S]*?)<\/script>/) ?? [])[1] ?? "{}") : {};
    const stores = [...body.matchAll(/<a [^>]*data-out-source="[^"]*"[^>]*>/g)].map((m) => m[0]);
    if (stores.length === 0) {
      fail(`${path} set: ${drink} has no store link`);
    }
    for (const tag of stores) {
      const href = attr(tag, "href") ?? "";
      if (attr(tag, "data-out-slug") !== drink || attr(tag, "data-out-source") !== "list") {
        fail(`${path} set: ${href} is not tagged as ${drink} from the list`);
      }
      if (map.links?.[href] !== attr(tag, "data-out-kind") || attr(tag, "data-out-kind") === "official") {
        fail(`${path} set: ${drink} links ${href} as ${attr(tag, "data-out-kind")}, the drink page has ${map.links?.[href]}`);
      }
      if (AFFILIATE.test(href)) {
        fail(`${path} set: affiliate parameter in ${href}`);
      }
    }
    sent.push(`　${units}本（${label}）\n`);
  }
  const totalTag = /<p class="[^"]*" data-total="(\d+)">([\s\S]*?)<\/p>/.exec(part);
  if (!totalTag || Number(totalTag[1]) !== total || total !== 6 || strip(totalTag[2]) !== `全部で${total}本`) {
    fail(`${path} total is not 「全部で6本」: ${totalTag ? strip(totalTag[2]) : "missing"}`);
  }
  const line = /<a href="(https:\/\/line\.me\/R\/share\?text=[^"]+)"[^>]*data-list-line="">([^<]*)<\/a>/.exec(part);
  const text = line ? decodeURIComponent(unescape(line[1]).split("text=")[1]) : "";
  if (!line || line[2] !== "買い出しの人にLINEで送る" || !/^.+のソフトドリンク（4人分）\n/.test(text) || !text.includes(`\n全部で${total}本\n`) || !text.endsWith(`${origin}${path}`) || sent.some((entry) => !text.includes(entry))) {
    fail(`${path} LINE link does not carry the set: ${JSON.stringify(text.slice(0, 80))}`);
  }
}

// 見た目 / サイズ / 味 name the criteria groups. They are not section headings:
// an h1–h6 whose text is one of them adds three extra entries to every scene outline.
const FILTER_LABELS = ["見た目", "サイズ", "味"];
const withoutScripts = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
const flat = (text) => strip(text).replace(/\s+/g, "");
const baPages = readdirSync(join("out", "ba"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
for (const slug of baPages) {
  const path = `/ba/${slug}/`;
  const html = withoutScripts(read(`ba/${slug}/index.html`));
  for (const match of html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = flat(match[2]);
    if (FILTER_LABELS.includes(text)) {
      fail(`${path} renders 「${text}」 as an h${match[1]}`);
    }
  }
  for (const label of FILTER_LABELS) {
    const labelled = [...html.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)].filter((match) => flat(match[2]) === label);
    if (labelled.length !== 1) {
      fail(`${path} 「${label}」 label occurs ${labelled.length} times, expected one paragraph`);
      continue;
    }
    const id = attr(`<p${labelled[0][1]}>`, "id");
    const named = id && new RegExp(`<div\\b(?=[^>]*\\brole="group")(?=[^>]*\\baria-labelledby="${id}")[^>]*>`).test(html);
    if (!named) {
      fail(`${path} 「${label}」 does not name a group`);
    }
  }
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(`✗ ${message}`);
  }
  process.exit(1);
}
console.log(`scenes ok: ${scenes.length} scene page(s), each with a recommended set`);
