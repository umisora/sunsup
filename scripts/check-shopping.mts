// The organiser's shopping list on scene pages, and the click counter's source tag.
import { onRequestPost } from "../functions/api/click.ts";
import { SCENES, sceneListItems } from "../lib/scenes.ts";
import { servingUnit } from "../lib/servings.ts";
import { lineShareUrl, listLines, listText, unitsFor, type ListItem } from "../lib/shopping-list.ts";

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

// Splitting the headcount over the picked drinks.
const item = (slug: string, people: number, dilute = false): ListItem => ({
  slug, name: slug, people, dilute, servingText: people === 1 ? "ひとり分" : `約${people}人分`, stores: [],
});
const lines = listLines([item("a", 1), item("b", 4), item("c", 1)], 10);
expect(lines.map((line) => line.people).join() === "4,3,3", `10 people over 3 drinks split 4,3,3, got ${lines.map((l) => l.people).join()}`);
expect(lines.map((line) => line.units).join() === "4,1,3", `units 4,1,3, got ${lines.map((l) => l.units).join()}`);
expect(listLines([item("a", 1), item("b", 1), item("c", 1)], 2).length === 2, "2 people over 3 drinks lists 2 lines");
expect(listLines([item("s", 0, true)], 30)[0]?.units === 1, "a syrup with no count is one bottle");
expect(unitsFor(9, 4) === 3 && unitsFor(8, 4) === 2, "units round up");
expect(listLines([item("a", 1)], 0)[0]?.people === 1 && listLines([item("a", 1)], 999)[0]?.people === 200, "headcount is kept between 1 and 200");
const text = listText("忘年会のノンアルコール", 10, lines, "https://stylish.sunsup.me/ba/bonenkai/");
expect(text.startsWith("忘年会のノンアルコール（10人分）\n・a 4本\n") && text.includes("合計 8本") && text.endsWith("/ba/bonenkai/"), `list text: ${text}`);
const share = lineShareUrl(text);
expect(share.startsWith("https://line.me/R/share?text=") && decodeURIComponent(share.split("text=")[1] ?? "") === text, "LINE link carries the list text");

// Every scene has a list; one drink picked per group; store links are plain product links.
const AFFILIATE = /[?&](tag|ascsubtag|linkCode|aff(iliate)?(_?id)?|scid|a8|afid)=/i;
for (const scene of SCENES) {
  const { items, picked } = sceneListItems(scene);
  expect(items.length >= 4, `${scene.slug}: only ${items.length} list items`);
  expect(picked.length === scene.groups.length, `${scene.slug}: picked ${picked.length} drinks for ${scene.groups.length} groups`);
  for (const entry of items) {
    expect(entry.stores.length > 0, `${scene.slug}/${entry.slug}: no store link`);
    for (const store of entry.stores) {
      expect(store.kind !== "official", `${scene.slug}/${entry.slug}: brand site in the list`);
      expect(!AFFILIATE.test(store.href), `${scene.slug}/${entry.slug}: affiliate parameter in ${store.href}`);
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

if (failures.length > 0) {
  console.error(failures.map((message) => `shopping: ${message}`).join("\n"));
  process.exit(1);
}
console.log(`shopping ok: ${SCENES.length} scene list(s), servings, split, LINE text and click source`);
