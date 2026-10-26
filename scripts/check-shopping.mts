// The organiser's shopping list on scene pages, and the click counter's source tag.
import { onRequest as middleware } from "../functions/_middleware.ts";
import { onRequestPost } from "../functions/api/click.ts";
import { getDrink } from "../lib/drinks.ts";
import { groupDrinks, SCENE_SETS, SCENES, sceneSet } from "../lib/scenes.ts";
import { servingUnit } from "../lib/servings.ts";
import { DEFAULT_HEADCOUNT, lineShareUrl, roleUnits, SET_ROLES, setLines, setText, setTotal, type SetCard } from "../lib/shopping-list.ts";

const failures: string[] = [];
function expect(ok: boolean, message: string) {
  if (!ok) {
    failures.push(message);
  }
}

// People per bottle: the catalog's count wins, then 180ml a person; syrups are 割って.
const unit = (name: string, size: string, vessel: string) => servingUnit({ name, size, vessel });
expect(unit("りんご 720ml", "720mlの瓶です。グラスに注いで、三、四人で分けます。", "大瓶")?.people === 3, "a catalog range counts its lower end");
expect(unit("みかん 780ml", "780mlの瓶です。", "大瓶")?.people === 4, "780ml with no count is 4 people at 180ml");
expect(unit("サイダー 250ml", "250mlの瓶です。", "ビン")?.people === 1, "a 250ml bottle is one person's");
expect(unit("お茶 500ml", "500mlのペットボトルです。", "ペットボトル")?.people === 1, "a 500ml PET bottle is one person's");
const syrup = unit("モナン ゆずシロップ 700ml", "700mlの瓶です。炭酸水で割って使います。", "大瓶");
expect(syrup?.dilute === true && syrup.people === 0 && syrup.text === "割って飲む", "a syrup with no count is shown as 割って");
const counted = unit("梅シロップ 500ml", "500mlの瓶です。水で割ると十人前後です。", "ビン");
expect(counted?.dilute === true && counted.people === 10 && counted.text.startsWith("割って"), "a syrup with a catalog count keeps it, marked 割って");
expect(unit("名前だけ", "届くのは24本です。", "ビン") === undefined, "no volume and no count gives no unit");

// Bottles per role: 乾杯用 one a person, テーブル用 one big bottle per 4, 食事用 one per 2.
expect(DEFAULT_HEADCOUNT === 4, "the set opens for 4 people");
expect(roleUnits("kanpai", 4) === 4 && roleUnits("table", 4) === 1 && roleUnits("meal", 4) === 2, "4 people: 4, 1, 2");
expect(roleUnits("table", 5) === 2 && roleUnits("meal", 5) === 3 && roleUnits("kanpai", 5) === 5, "units round up");
expect(roleUnits("kanpai", 0) === 1 && roleUnits("kanpai", 999) === 200, "headcount is kept between 1 and 200");
const card = (role: SetCard["role"], ...slugs: string[]): SetCard => ({
  role,
  reason: "r",
  items: slugs.map((slug) => ({ slug, name: slug, still: `/drinks/${slug}.webp`, size: "", stores: [] })),
});
const cards = [card("kanpai", "a", "a2"), card("table", "b"), card("meal", "c", "c2")];
const lines = setLines(cards, {}, 4);
expect(lines.map((line) => `${line.item.slug}${line.units}`).join() === "a4,b1,c2" && setTotal(lines) === 7, "4 people take 7 bottles of the first picks");
const swapped = setLines(cards, { meal: "c2", kanpai: "nope" }, 4);
expect(swapped.map((line) => line.item.slug).join() === "a,b,c2", "a swap replaces only its role; an unknown pick falls back to the first");
const text = setText("忘年会・新年会のソフトドリンク", 4, lines, "https://stylish.sunsup.me/ba/bonenkai/");
expect(
  text === "忘年会・新年会のソフトドリンク（4人分）\n・a　4本（乾杯用）\n・b　1本（テーブル用）\n・c　2本（食事用）\n全部で7本\nhttps://stylish.sunsup.me/ba/bonenkai/",
  `list text: ${JSON.stringify(text)}`,
);
const share = lineShareUrl(text);
expect(share.startsWith("https://line.me/R/share?text=") && decodeURIComponent(share.split("text=")[1] ?? "") === text, "LINE link carries the list text");

// Every scene has three role cards; 乾杯用 and 食事用 come from the page's own drinks, テーブル用 is a big bottle;
// every listed slug is shown (no silent drop), and store links are plain product links.
const AFFILIATE = /[?&](tag|ascsubtag|linkCode|aff(iliate)?(_?id)?|scid|a8|afid)=/i;
expect(Object.keys(SCENE_SETS).sort().join() === SCENES.map((scene) => scene.slug).sort().join(), "every scene has a set, and no set is orphaned");
for (const scene of SCENES) {
  const set = SCENE_SETS[scene.slug];
  const { title, cards: built } = sceneSet(scene);
  expect(title.endsWith("のソフトドリンク"), `${scene.slug}: list title ${title}`);
  expect(built.map((entry) => entry.role).join() === SET_ROLES.join(), `${scene.slug}: roles ${built.map((entry) => entry.role).join()}`);
  const onPage = new Set(scene.groups.flatMap((group) => groupDrinks(group).map((drink) => drink.slug)));
  for (const entry of built) {
    const slugs = set?.roles[entry.role].slugs ?? [];
    expect(entry.items.length === slugs.length && entry.items.length >= 2, `${scene.slug}/${entry.role}: ${entry.items.length} of ${slugs.length} drinks usable`);
    expect(new Set(slugs).size === slugs.length, `${scene.slug}/${entry.role}: a slug repeats`);
    expect(entry.reason.length > 0 && entry.reason.endsWith("。"), `${scene.slug}/${entry.role}: reason`);
    for (const item of entry.items) {
      if (entry.role === "table") {
        expect(getDrink(item.slug)?.vessel === "大瓶", `${scene.slug}/table: ${item.slug} is not a 大瓶`);
      } else {
        expect(onPage.has(item.slug), `${scene.slug}/${entry.role}: ${item.slug} is not among the page's drinks`);
      }
      expect(item.still.startsWith("/drinks/"), `${scene.slug}/${item.slug}: no still`);
      expect(!item.size || !item.name.includes(item.size), `${scene.slug}/${item.slug}: size ${item.size} repeats the name`);
      expect(item.stores.length > 0, `${scene.slug}/${item.slug}: no store link`);
      for (const store of item.stores) {
        expect(store.kind !== "official", `${scene.slug}/${item.slug}: brand site in the list`);
        expect(!AFFILIATE.test(store.href), `${scene.slug}/${item.slug}: affiliate parameter in ${store.href}`);
      }
    }
  }
}

// /api/click keeps the source, falls back to the old insert before the migration, and drops unknown sources to page.
type Call = { sql: string; values: unknown[] };
function fakeDb(failWithSource: boolean) {
  const calls: Call[] = [];
  return {
    calls,
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            run: async () => {
              calls.push({ sql, values });
              if (failWithSource && sql.includes("source")) {
                throw new Error("table clicks has no column named source");
              }
              return {};
            },
          };
        },
      };
    },
  };
}
async function post(body: object, failWithSource = false) {
  const db = fakeDb(failWithSource);
  const pending: Promise<unknown>[] = [];
  const request = new Request("https://stylish.sunsup.me/api/click", {
    method: "POST",
    headers: { origin: "https://stylish.sunsup.me", "user-agent": "Mozilla/5.0 (iPhone)", "content-type": "text/plain;charset=UTF-8" },
    body: JSON.stringify(body),
  });
  const response = await onRequestPost({ request, env: { METRICS: db }, waitUntil: (promise) => pending.push(promise) });
  await Promise.all(pending);
  return { status: response.status, calls: db.calls };
}
const click = { slug: "kimino-yuzu", kind: "amazon", path: "/ba/bonenkai/" };
const listed = await post({ ...click, source: "list" });
expect(listed.status === 204 && listed.calls.length === 1 && listed.calls[0]?.values[6] === "list", "a list click is stored with source=list");
const junk = await post({ ...click, source: "<script>" });
expect(junk.calls[0]?.values[6] === "page", "an unknown source is stored as page");
const plain = await post(click);
expect(plain.calls[0]?.values[6] === "page", "a click with no source is stored as page");
const before = await post({ ...click, source: "list" }, true);
expect(before.calls.length === 2 && !before.calls[1]?.sql.includes("source"), "before the migration the old insert still counts the click");

// The gift page moved from /ba/nomanai-hito/ to /ba/okurimono/: a 301 on the same host, query kept; other paths pass.
const passed = new Response("next");
for (const [from, to] of [
  ["https://stylish.sunsup.me/ba/nomanai-hito/", "https://stylish.sunsup.me/ba/okurimono/"],
  ["https://stylish.sunsup.me/ba/nomanai-hito?a=1", "https://stylish.sunsup.me/ba/okurimono/?a=1"],
  ["https://still-batch-next.sunsup-dv4.pages.dev/ba/nomanai-hito/", "https://still-batch-next.sunsup-dv4.pages.dev/ba/okurimono/"],
]) {
  const response = await middleware({ request: new Request(from), next: async () => passed });
  expect(response.status === 301 && response.headers.get("location") === to, `${from} moves to ${to}, got ${response.status} ${response.headers.get("location")}`);
}
expect((await middleware({ request: new Request("https://stylish.sunsup.me/ba/okurimono/"), next: async () => passed })) === passed, "/ba/okurimono/ is served as is");

if (failures.length > 0) {
  console.error(failures.map((message) => `shopping: ${message}`).join("\n"));
  process.exit(1);
}
console.log(`shopping ok: ${SCENES.length} scene list(s), servings, role bottles, swaps, LINE text, click source and the okurimono 301`);
