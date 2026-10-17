import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isGenericProduct } from "./generic-rule.mjs";

/**
 * トップの話が引くドリンクのプール。
 * 公開中で、白い背景の実物の静物があるものだけ。
 * 季節・天気・地域は品名から取る。定番は CSV の列をそのまま使う。
 * いま卓に載っている13本の枠は、手で測った値を優先する。
 */

const HAND = {
  "kimino-yuzu": { stand: "full", frame: { nw: 1000, nh: 1000, l: 351, t: 103, cw: 405, ch: 834 } },
  "kimino-ringo": { stand: "full", frame: { nw: 1100, nh: 1100, l: 383, t: 113, cw: 455, ch: 920 } },
  "kimino-ume": { stand: "full", frame: { nw: 1100, nh: 1100, l: 385, t: 118, cw: 451, ch: 919 } },
  "fujiya-nectar-peach": { stand: "can", frame: { nw: 350, nh: 350, l: 92, t: 25, cw: 164, ch: 310 } },
  "fujiya-sparkling-peach": { stand: "full", frame: { nw: 750, nh: 750, l: 248, t: 49, cw: 255, ch: 650 } },
  "sanpellegrino-aranciata": { stand: "full", frame: { nw: 380, nh: 1000, l: 0, t: 1, cw: 380, ch: 998 } },
  "suntory-oolong-340": { stand: "can", frame: { nw: 528, nh: 1000, l: 0, t: 0, cw: 528, ch: 1000 } },
  "kimura-akafuji": { stand: "full", frame: { nw: 750, nh: 750, l: 287, t: 32, cw: 180, ch: 684 } },
  "kimura-shine-muscat": { stand: "full", frame: { nw: 750, nh: 750, l: 275, t: 31, cw: 199, ch: 688 } },
  "kimura-yamanashi-budo": { stand: "full", frame: { nw: 750, nh: 750, l: 282, t: 28, cw: 190, ch: 687 } },
  "kimura-mikan100-200": { stand: "full", frame: { nw: 750, nh: 750, l: 281, t: 34, cw: 180, ch: 684 } },
  "kimura-momo-cider": { stand: "full", frame: { nw: 750, nh: 750, l: 280, t: 27, cw: 189, ch: 705 } },
  "kimura-fuji-yuzu": { stand: "full", frame: { nw: 750, nh: 750, l: 286, t: 32, cw: 180, ch: 688 } },
  "kodama-ginger-250": { stand: "full", frame: { nw: 1000, nh: 1000, l: 319, t: 14, cw: 357, ch: 972 } },
  "maison-perrier-lime-ginger-330": { stand: "can", frame: { nw: 1000, nh: 1000, l: 318, t: 40, cw: 362, ch: 915 } },
  "aoren-shun-ringo-195": { stand: "can", frame: { nw: 432, nh: 376, l: 142, t: 28, cw: 150, ch: 320 } },
};

const PLACES = [
  ["北海道", "hokkaido"],
  ["富良野", "hokkaido"],
  ["札幌", "hokkaido"],
  ["小樽", "hokkaido"],
  ["余市", "hokkaido"],
  ["知床", "hokkaido"],
  ["十勝", "hokkaido"],
  ["夕張", "hokkaido"],
  ["帯広", "hokkaido"],
  ["中札内", "hokkaido"],
  ["芽室", "hokkaido"],
  ["幕別", "hokkaido"],
  ["更別", "hokkaido"],
  ["本別", "hokkaido"],
  ["青森", "tohoku"],
  ["弘前", "tohoku"],
  ["岩手", "tohoku"],
  ["盛岡", "tohoku"],
  ["宮城", "tohoku"],
  ["仙台", "tohoku"],
  ["秋田", "tohoku"],
  ["山形", "tohoku"],
  ["福島", "tohoku"],
  ["会津", "tohoku"],
  ["津軽", "tohoku"],
  ["伊達", "tohoku"],
  ["ずんだ", "tohoku"],
  ["葛巻", "tohoku"],
  ["龍泉洞", "tohoku"],
  ["茨城", "kanto"],
  ["栃木", "kanto"],
  ["群馬", "kanto"],
  ["埼玉", "kanto"],
  ["千葉", "kanto"],
  ["東京", "kanto"],
  ["神奈川", "kanto"],
  ["横浜", "kanto"],
  ["鎌倉", "kanto"],
  ["箱根", "kanto"],
  ["小田原", "kanto"],
  ["南足柄", "kanto"],
  ["湘南", "kanto"],
  ["秩父", "kanto"],
  ["日光", "kanto"],
  ["那須", "kanto"],
  ["房総", "kanto"],
  ["奥久慈", "kanto"],
  ["新潟", "chubu"],
  ["富山", "chubu"],
  ["石川", "chubu"],
  ["福井", "chubu"],
  ["山梨", "chubu"],
  ["長野", "chubu"],
  ["岐阜", "chubu"],
  ["静岡", "chubu"],
  ["愛知", "chubu"],
  ["信州", "chubu"],
  ["甲州", "chubu"],
  ["甲府", "chubu"],
  ["伊豆", "chubu"],
  ["駿河", "chubu"],
  ["加賀", "chubu"],
  ["金沢", "chubu"],
  ["能登", "chubu"],
  ["越後", "chubu"],
  ["飛騨", "chubu"],
  ["郡上", "chubu"],
  ["岡崎", "chubu"],
  ["浜松", "chubu"],
  ["信濃", "chubu"],
  ["富士山", "chubu"],
  ["赤富士", "chubu"],
  ["三ヶ日", "chubu"],
  ["片浦", "chubu"],
  ["養老", "chubu"],
  ["奥能登", "chubu"],
  ["三重", "kansai"],
  ["滋賀", "kansai"],
  ["京都", "kansai"],
  ["大阪", "kansai"],
  ["兵庫", "kansai"],
  ["奈良", "kansai"],
  ["和歌山", "kansai"],
  ["神戸", "kansai"],
  ["宇治", "kansai"],
  ["伊勢", "kansai"],
  ["紀州", "kansai"],
  ["熊野", "kansai"],
  ["有馬", "kansai"],
  ["ありま", "kansai"],
  ["近江", "kansai"],
  ["有田", "kansai"],
  ["鳥取", "chugoku"],
  ["島根", "chugoku"],
  ["岡山", "chugoku"],
  ["広島", "chugoku"],
  ["山口", "chugoku"],
  ["出雲", "chugoku"],
  ["尾道", "chugoku"],
  ["宮島", "chugoku"],
  ["萩", "chugoku"],
  ["白バラ", "chugoku"],
  ["徳島", "shikoku"],
  ["香川", "shikoku"],
  ["愛媛", "shikoku"],
  ["高知", "shikoku"],
  ["伊予", "shikoku"],
  ["土佐", "shikoku"],
  ["讃岐", "shikoku"],
  ["阿波", "shikoku"],
  ["今治", "shikoku"],
  ["松山", "shikoku"],
  ["道後", "shikoku"],
  ["小豆島", "shikoku"],
  ["すだち", "shikoku"],
  ["馬路村", "shikoku"],
  ["福岡", "kyushu"],
  ["佐賀", "kyushu"],
  ["長崎", "kyushu"],
  ["熊本", "kyushu"],
  ["大分", "kyushu"],
  ["宮崎", "kyushu"],
  ["鹿児島", "kyushu"],
  ["博多", "kyushu"],
  ["知覧", "kyushu"],
  ["八女", "kyushu"],
  ["日向", "kyushu"],
  ["薩摩", "kyushu"],
  ["桜島", "kyushu"],
  ["阿蘇", "kyushu"],
  ["別府", "kyushu"],
  ["由布", "kyushu"],
  ["奄美", "kyushu"],
  ["あまおう", "kyushu"],
  ["かぼす", "kyushu"],
  ["指宿", "kyushu"],
  ["沖縄", "okinawa"],
  ["石垣", "okinawa"],
  ["宮古", "okinawa"],
  ["久米島", "okinawa"],
  ["琉球", "okinawa"],
  ["やんばる", "okinawa"],
  ["ちゅらうみ", "okinawa"],
  ["オリオン", "okinawa"],
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") {
        i += 1;
      }
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
  }
  return rows;
}

function has(name, word) {
  return name.includes(word);
}

function regionOf(name) {
  const hits = [];
  for (const [word, region] of PLACES) {
    const at = name.indexOf(word);
    if (at >= 0) {
      hits.push({ word, region, at, len: word.length });
    }
  }
  const usable = hits.filter((hit) => {
    if (hit.word !== "京都") {
      return true;
    }
    return !hits.some((other) => other.word === "東京" && other.at === hit.at - 1);
  });
  usable.sort((a, b) => b.len - a.len || a.at - b.at);
  return usable[0]?.region ?? null;
}

function fitOf(name) {
  const seasons = new Set();
  const weather = new Set();
  const add = (nextSeasons, nextWeather) => {
    for (const season of nextSeasons) {
      seasons.add(season);
    }
    for (const bucket of nextWeather) {
      weather.add(bucket);
    }
  };
  const pineapple = has(name, "パイナップル");
  const grapefruit = has(name, "グレープフルーツ");

  if (has(name, "ゆず") || has(name, "柚子") || has(name, "YUZU") || has(name, "yuzu")) {
    add(["autumn", "winter"], ["cold", "hot"]);
  }
  if (!pineapple && (has(name, "りんご") || has(name, "林檎") || has(name, "アップル") || has(name, "APPLE") || has(name, "RINGO"))) {
    add(["autumn"], ["cold"]);
  }
  if (
    has(name, "ぶどう") ||
    has(name, "葡萄") ||
    has(name, "マスカット") ||
    has(name, "巨峰") ||
    has(name, "甲州") ||
    has(name, "MUSCAT") ||
    (!grapefruit && (has(name, "グレープ") || has(name, "GRAPE")))
  ) {
    add(["autumn"], []);
  }
  if (has(name, "梨") || has(name, "ラフランス") || has(name, "柿") || has(name, "栗") || has(name, "シャルドネ")) {
    add(["autumn"], []);
  }
  if (has(name, "ほうじ")) {
    add(["autumn", "winter"], ["cold"]);
  }
  if (has(name, "紅茶") || has(name, "ミルクティー") || has(name, "ココア") || has(name, "甘酒")) {
    add(["autumn", "winter"], ["cold"]);
  }
  if (has(name, "みかん") || has(name, "蜜柑") || has(name, "MIKAN") || has(name, "mikan")) {
    add(["winter"], ["cold"]);
  }
  if (has(name, "しょうが") || has(name, "生姜") || has(name, "ジンジャー") || has(name, "GINGER") || has(name, "ginger")) {
    add(["autumn", "winter"], ["cold", "hot"]);
  }
  if (has(name, "梅") || has(name, "うめ") || has(name, "UME")) {
    add(["spring", "summer"], []);
  }
  if (has(name, "桃") || has(name, "ピーチ") || has(name, "PEACH") || has(name, "MOMO")) {
    add(["spring", "summer"], ["hot"]);
  }
  if (has(name, "さくら") || has(name, "桜") || has(name, "いちご") || has(name, "苺") || has(name, "甘夏") || has(name, "はっさく") || has(name, "八朔")) {
    add(["spring"], ["hot"]);
  }
  if (
    has(name, "レモン") ||
    has(name, "LEMON") ||
    has(name, "ライム") ||
    has(name, "LIME") ||
    has(name, "オレンジ") ||
    has(name, "ORANGE") ||
    has(name, "ミント") ||
    has(name, "MINT") ||
    has(name, "マンゴー") ||
    has(name, "パイン") ||
    has(name, "すいか") ||
    has(name, "スイカ") ||
    has(name, "メロン") ||
    has(name, "日向夏") ||
    has(name, "柑橘") ||
    grapefruit ||
    has(name, "トニック")
  ) {
    add(["summer"], ["hot"]);
  }
  if (has(name, "麦茶")) {
    add(["summer"], ["hot"]);
  }
  if (has(name, "ラムネ") || has(name, "サイダー") || has(name, "ソーダ") || has(name, "炭酸") || has(name, "スパークリング") || has(name, "SPARKLING")) {
    add(["summer"], ["hot"]);
  }
  if (seasons.size > 0) {
    weather.add("mild");
    weather.add("rain");
  }
  return { seasons: [...seasons], weather: [...weather] };
}

function shortSize(value) {
  const head = value.split("。")[0] ?? "";
  if (head !== "" && [...head].length <= 18) {
    return head;
  }
  return "";
}

function standFor(frame) {
  return frame.ch / frame.cw >= 2 ? "full" : "can";
}

const table = parseCsv(readFileSync(join("data", "drinks.csv"), "utf8"));
const header = table[0];
const drinks = table.slice(1).map((row) => Object.fromEntries(header.map((column, index) => [column, (row[index] ?? "").trim()])));
const frames = JSON.parse(readFileSync(join("data", "still-frames.json"), "utf8"));

let mismatched = 0;
for (const drink of drinks) {
  const flag = drink["定番"];
  if (flag !== "0" && flag !== "1") {
    throw new Error(`${drink.slug} 定番 must be 0 or 1`);
  }
  const generic = isGenericProduct(drink["品名"]);
  if ((flag === "1") !== generic) {
    mismatched += 1;
    if (mismatched <= 8) {
      console.error(`${drink.slug} 定番=${flag} but rule says ${generic ? "1" : "0"}: ${drink["品名"]}`);
    }
  }
}
if (mismatched > 0) {
  throw new Error(`${mismatched} 定番 values disagree with scripts/generic-rule.mjs`);
}

const pool = [];
for (const drink of drinks) {
  if (drink["公開"] !== "1") {
    continue;
  }
  const still = drink["静物URL"];
  if (!still.startsWith("/drinks/") || still.includes("fallback-")) {
    continue;
  }
  const slug = drink.slug;
  const measured = frames[slug];
  if (!measured) {
    throw new Error(`missing still frame for ${slug}`);
  }
  if (!measured.table) {
    continue;
  }
  const hand = HAND[slug];
  const frame = hand ? hand.frame : { nw: measured.nw, nh: measured.nh, l: measured.l, t: measured.t, cw: measured.cw, ch: measured.ch };
  const fit = fitOf(drink["品名"]);
  pool.push({
    slug,
    name: drink["品名"],
    src: still,
    category: drink["カテゴリ"],
    size: shortSize(drink["サイズ"]),
    seasons: fit.seasons,
    weather: fit.weather,
    region: regionOf(drink["品名"]),
    generic: drink["定番"] === "1",
    vessel: drink["容器"],
    stand: hand ? hand.stand : standFor(frame),
    frame,
  });
}

pool.sort((a, b) => a.slug.localeCompare(b.slug));
writeFileSync(join("data", "visit-pool.json"), `${JSON.stringify(pool)}\n`);

const featured = pool.filter((drink) => !drink.generic && drink.seasons.length > 0);
const bySeason = {};
for (const drink of featured) {
  for (const season of drink.seasons) {
    bySeason[season] = (bySeason[season] ?? 0) + 1;
  }
}
console.log(
  `[visit-pool] ${pool.length} table drinks, ${pool.filter((drink) => drink.generic).length} generic, ${featured.length} featured with a season`,
);
console.log("[visit-pool] featured by season", bySeason);
