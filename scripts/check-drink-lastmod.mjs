// Fails when a store-URL-only drinks.csv edit would move a drink's lastmod,
// or when a real content edit would not.
import {
  contentSignature,
  dayFromUnix,
  drinkContentLastmods,
  drinkContentTimes,
  rowsBySlug,
} from "./drink-lastmod.mjs";

const failures = [];
function expect(ok, message) {
  if (!ok) {
    failures.push(message);
  }
}

const header = "slug,品名,公式URL,AmazonURL,楽天URL,直販URL,その他URL";
const older = `${header}
peach,ネクター,https://official.example/peach,,,,
ginger,ジンジャー,https://official.example/ginger,,,,
`;
const rakutenOnly = `${header}
peach,ネクター,https://official.example/peach,,https://item.rakuten.co.jp/peach/,
ginger,ジンジャー,https://official.example/ginger,,,,
`;
const officialChanged = `${header}
peach,ネクター,https://official.example/peach/product,,https://item.rakuten.co.jp/peach/,
ginger,ジンジャー,https://official.example/ginger,,,,
`;
const nameChanged = `${header}
peach,ネクター ピーチ,https://official.example/peach/product,,https://item.rakuten.co.jp/peach/,
ginger,ジンジャー,https://official.example/ginger,,,,
`;

const t1 = 1794279600; // 2026-11-10 12:00 Asia/Tokyo
const t2 = 1795316400; // 2026-11-22 12:00 Asia/Tokyo
const t3 = 1795748400; // 2026-11-27 12:00 Asia/Tokyo

expect(dayFromUnix(t1) === "2026-11-10", `t1 day was ${dayFromUnix(t1)}`);
expect(dayFromUnix(t2) === "2026-11-22", `t2 day was ${dayFromUnix(t2)}`);
expect(dayFromUnix(t3) === "2026-11-27", `t3 day was ${dayFromUnix(t3)}`);

const peachOlder = contentSignature(rowsBySlug(older).get("peach"));
const peachRakuten = contentSignature(rowsBySlug(rakutenOnly).get("peach"));
const peachOfficial = contentSignature(rowsBySlug(officialChanged).get("peach"));
const peachName = contentSignature(rowsBySlug(nameChanged).get("peach"));
expect(peachOlder === peachRakuten, "Rakuten-only edits must not change the content signature");
expect(peachOlder !== peachOfficial, "official URL edits must change the content signature");
expect(peachOfficial !== peachName, "name edits must change the content signature");

const history = [
  { time: t3, text: officialChanged },
  { time: t2, text: rakutenOnly },
  { time: t1, text: older },
];

const fromOfficial = drinkContentTimes({
  currentText: officialChanged,
  headText: officialChanged,
  history,
});
expect(fromOfficial.get("peach") === t3, `official URL change lastmod was ${fromOfficial.get("peach")}`);
expect(fromOfficial.get("ginger") === t1, `unchanged ginger lastmod was ${fromOfficial.get("ginger")}`);

const fromRakuten = drinkContentTimes({
  currentText: rakutenOnly,
  headText: rakutenOnly,
  history: [
    { time: t2, text: rakutenOnly },
    { time: t1, text: older },
  ],
});
expect(fromRakuten.get("peach") === t1, `Rakuten-only lastmod should stay ${t1}, got ${fromRakuten.get("peach")}`);

const dirtyName = drinkContentTimes({
  currentText: nameChanged,
  headText: officialChanged,
  history,
});
expect(dirtyName.get("peach") == null, "uncommitted name change must omit lastmod");
expect(dirtyName.get("ginger") === t1, `sibling row should keep its lastmod, got ${dirtyName.get("ginger")}`);

const dirtyStore = drinkContentTimes({
  currentText: officialChanged.replace("https://item.rakuten.co.jp/peach/", "https://item.rakuten.co.jp/peach-2/"),
  headText: officialChanged,
  history,
});
expect(dirtyStore.get("peach") === t3, `uncommitted store URL must keep lastmod ${t3}, got ${dirtyStore.get("peach")}`);

// Live catalog: a later Rakuten-only commit must not stamp lastmod.
const live = drinkContentLastmods();
if (!live) {
  failures.push("could not read drinks.csv git history for lastmod");
} else {
  expect(live.get("fujiya-nectar-peach") === "2026-11-10", `fujiya-nectar-peach lastmod is ${live.get("fujiya-nectar-peach")} (later commits only added a Rakuten URL)`);
  expect(live.get("georgia-black-can") === "2026-11-27", `georgia-black-can lastmod is ${live.get("georgia-black-can")} (the official name change should move it)`);
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(message);
  }
  process.exit(1);
}
console.log("drink lastmod ok: store-URL-only edits do not move lastmod; official URL and name edits do");
