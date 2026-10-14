export type Season = "spring" | "summer" | "autumn" | "winter";

export type Weather = "hot" | "cold" | "rain" | "mild";

export type Region =
  | "hokkaido"
  | "tohoku"
  | "kanto"
  | "chubu"
  | "kansai"
  | "chugoku"
  | "shikoku"
  | "kyushu"
  | "okinawa";

export type Daypart = "morning" | "afternoon" | "evening";

export type VisitStory = {
  id: string;
  season: Season;
  weather?: Weather;
  region?: Region;
  daypart?: Daypart;
  kicker: string;
  lead: readonly [string, string];
  slugs: readonly string[];
};

export type VisitQuery = {
  season: Season;
  daypart: Daypart;
  weather?: Weather;
  region?: Region;
  storyId?: string;
  random?: () => number;
};

/** Baked into the static HTML so the first paint is never empty. */
export const DEFAULT_STORY_ID = "autumn-afternoon";

const PREFECTURE_REGION: Readonly<Record<string, Region>> = {
  hokkaido: "hokkaido",
  aomori: "tohoku",
  iwate: "tohoku",
  miyagi: "tohoku",
  akita: "tohoku",
  yamagata: "tohoku",
  fukushima: "tohoku",
  ibaraki: "kanto",
  tochigi: "kanto",
  gunma: "kanto",
  saitama: "kanto",
  chiba: "kanto",
  tokyo: "kanto",
  kanagawa: "kanto",
  niigata: "chubu",
  toyama: "chubu",
  ishikawa: "chubu",
  fukui: "chubu",
  yamanashi: "chubu",
  nagano: "chubu",
  gifu: "chubu",
  shizuoka: "chubu",
  aichi: "chubu",
  mie: "kansai",
  shiga: "kansai",
  kyoto: "kansai",
  osaka: "kansai",
  hyogo: "kansai",
  nara: "kansai",
  wakayama: "kansai",
  tottori: "chugoku",
  shimane: "chugoku",
  okayama: "chugoku",
  hiroshima: "chugoku",
  yamaguchi: "chugoku",
  tokushima: "shikoku",
  kagawa: "shikoku",
  ehime: "shikoku",
  kochi: "shikoku",
  fukuoka: "kyushu",
  saga: "kyushu",
  nagasaki: "kyushu",
  kumamoto: "kyushu",
  oita: "kyushu",
  miyazaki: "kyushu",
  kagoshima: "kyushu",
  okinawa: "okinawa",
};

const PREFECTURE_CODE: Readonly<Record<string, Region>> = {
  "01": "hokkaido",
  "02": "tohoku",
  "03": "tohoku",
  "04": "tohoku",
  "05": "tohoku",
  "06": "tohoku",
  "07": "tohoku",
  "08": "kanto",
  "09": "kanto",
  "10": "kanto",
  "11": "kanto",
  "12": "kanto",
  "13": "kanto",
  "14": "kanto",
  "15": "chubu",
  "16": "chubu",
  "17": "chubu",
  "18": "chubu",
  "19": "chubu",
  "20": "chubu",
  "21": "chubu",
  "22": "chubu",
  "23": "chubu",
  "24": "kansai",
  "25": "kansai",
  "26": "kansai",
  "27": "kansai",
  "28": "kansai",
  "29": "kansai",
  "30": "kansai",
  "31": "chugoku",
  "32": "chugoku",
  "33": "chugoku",
  "34": "chugoku",
  "35": "chugoku",
  "36": "shikoku",
  "37": "shikoku",
  "38": "shikoku",
  "39": "shikoku",
  "40": "kyushu",
  "41": "kyushu",
  "42": "kyushu",
  "43": "kyushu",
  "44": "kyushu",
  "45": "kyushu",
  "46": "kyushu",
  "47": "okinawa",
};

function story(
  id: string,
  season: Season,
  kicker: string,
  lead: readonly [string, string],
  slugs: readonly string[],
  extra?: { weather?: Weather; region?: Region; daypart?: Daypart },
): VisitStory {
  return { id, season, kicker, lead, slugs, ...extra };
}

export const STORIES: readonly VisitStory[] = [
  story("autumn-afternoon", "autumn", "秋の午後", ["会議のあと。", "りんごと白桃。"], ["kimino-ringo", "fujiya-sparkling-peach", "suntory-oolong-340"], { daypart: "afternoon" }),
  story("autumn-afternoon-b", "autumn", "秋の午後", ["日が傾く前。", "ぶどうを一本。"], ["kimura-shine-muscat", "kimura-akafuji", "suntory-oolong-340"], { daypart: "afternoon" }),
  story("autumn-morning", "autumn", "秋の朝", ["出社した席。", "りんごから。"], ["kimino-ringo", "suntory-oolong-340", "aoren-shun-ringo-195"], { daypart: "morning" }),
  story("autumn-evening", "autumn", "秋の夜", ["残った人の席。", "瓶を合わせる。"], ["kimino-ringo", "fujiya-sparkling-peach", "kimura-yamanashi-budo"], { daypart: "evening" }),
  story("autumn-evening-b", "autumn", "秋の夜", ["明かりの下で。", "白桃を真ん中に。"], ["fujiya-sparkling-peach", "kimino-ume", "suntory-oolong-340"], { daypart: "evening" }),
  story("autumn-rain", "autumn", "雨の日", ["傘を置いて。", "烏龍茶とぶどう。"], ["kimura-akafuji", "suntory-oolong-340", "kimura-shine-muscat"], { weather: "rain" }),
  story("autumn-rain-b", "autumn", "雨の日", ["窓を見る席。", "ぶどうの瓶。"], ["kimura-yamanashi-budo", "kimura-akafuji", "suntory-oolong-340"], { weather: "rain" }),
  story("autumn-cold", "autumn", "冷える夕方", ["空気が冷たい。", "しょうがを一本。"], ["kodama-ginger-250", "kimino-ringo", "suntory-oolong-340"], { weather: "cold" }),
  story("autumn-cold-b", "autumn", "冷える夕方", ["手元を温める。", "りんごの炭酸。"], ["kimino-ringo", "kodama-ginger-250", "aoren-shun-ringo-195"], { weather: "cold" }),
  story("autumn-hot", "autumn", "残暑", ["まだ暑い午後。", "冷たい柑橘。"], ["kimino-yuzu", "sanpellegrino-aranciata", "fujiya-nectar-peach"], { weather: "hot" }),
  story("autumn-hot-b", "autumn", "残暑", ["冷房のきいた席。", "ゆずを開ける。"], ["kimino-yuzu", "sanpellegrino-aranciata", "maison-perrier-lime-ginger-330"], { weather: "hot" }),
  story("autumn-mild", "autumn", "穏やかな午後", ["風のない日。", "白桃を並べる。"], ["fujiya-sparkling-peach", "kimino-ringo", "suntory-oolong-340"], { weather: "mild" }),
  story("autumn-mild-b", "autumn", "穏やかな午後", ["席を少し空ける。", "梅とりんご。"], ["kimino-ume", "kimino-ringo", "suntory-oolong-340"], { weather: "mild" }),
  story("autumn-rain-kanto", "autumn", "関東の雨", ["窓に雨が当たる。", "ぶどうを真ん中に。"], ["kimura-akafuji", "kimura-yamanashi-budo", "suntory-oolong-340"], { weather: "rain", region: "kanto" }),
  story("autumn-rain-kanto-b", "autumn", "関東の雨", ["濡れた傘のあと。", "烏龍茶を置く。"], ["kimura-shine-muscat", "suntory-oolong-340", "kimura-akafuji"], { weather: "rain", region: "kanto" }),
  story("autumn-cold-hokkaido", "autumn", "北海道の冷え", ["外はもう冷たい。", "しょうがとりんご。"], ["kodama-ginger-250", "kimino-ringo", "aoren-shun-ringo-195"], { weather: "cold", region: "hokkaido" }),
  story("autumn-cold-hokkaido-b", "autumn", "北海道の冷え", ["厚い窓の向こう。", "りんごの缶。"], ["aoren-shun-ringo-195", "kimino-ringo", "kodama-ginger-250"], { weather: "cold", region: "hokkaido" }),
  story("autumn-cold-tohoku", "autumn", "東北の夕方", ["日が落ちると。", "りんごを先に。"], ["aoren-shun-ringo-195", "kimino-ringo", "kodama-ginger-250"], { weather: "cold", region: "tohoku" }),
  story("autumn-mild-kansai", "autumn", "関西の午後", ["昼の会議のあと。", "白桃を人数分。"], ["fujiya-sparkling-peach", "kimino-ringo", "suntory-oolong-340"], { weather: "mild", region: "kansai" }),
  story("autumn-hot-okinawa", "autumn", "沖縄の残暑", ["まだ夏の熱。", "冷えた柑橘を。"], ["kimino-yuzu", "sanpellegrino-aranciata", "fujiya-nectar-peach"], { weather: "hot", region: "okinawa" }),
  story("autumn-rain-kyushu", "autumn", "九州の雨", ["雨のオフィス。", "烏龍茶とぶどう。"], ["kimura-akafuji", "suntory-oolong-340", "kimura-shine-muscat"], { weather: "rain", region: "kyushu" }),
  story("autumn-mild-chubu", "autumn", "甲信の午後", ["ぶどうの季節。", "山梨の瓶を。"], ["kimura-akafuji", "kimura-yamanashi-budo", "kimura-shine-muscat"], { weather: "mild", region: "chubu" }),
  story("autumn-hot-kanto", "autumn", "関東の残暑", ["十月でも暑い。", "炭酸を先に。"], ["kimino-yuzu", "sanpellegrino-aranciata", "suntory-oolong-340"], { weather: "hot", region: "kanto" }),
  story("autumn-rain-chugoku", "autumn", "中国地方の雨", ["曇りの席。", "烏龍茶を開ける。"], ["kimura-yamanashi-budo", "suntory-oolong-340", "kimino-ume"], { weather: "rain", region: "chugoku" }),
  story("autumn-mild-shikoku", "autumn", "四国の午後", ["瀬戸内の光。", "ゆずを置く。"], ["kimino-yuzu", "kimura-fuji-yuzu", "sanpellegrino-aranciata"], { weather: "mild", region: "shikoku" }),
  story("summer-afternoon", "summer", "夏の午後", ["会議の合間。", "桃を人数分。"], ["fujiya-nectar-peach", "fujiya-sparkling-peach", "sanpellegrino-aranciata"], { daypart: "afternoon" }),
  story("summer-afternoon-b", "summer", "夏の午後", ["長い昼休み。", "ライムの缶。"], ["maison-perrier-lime-ginger-330", "sanpellegrino-aranciata", "fujiya-nectar-peach"], { daypart: "afternoon" }),
  story("summer-morning", "summer", "夏の朝", ["出社してすぐ。", "冷えたゆず。"], ["kimino-yuzu", "maison-perrier-lime-ginger-330"], { daypart: "morning" }),
  story("summer-evening", "summer", "夏の夜", ["残業のあとに。", "桃と柑橘。"], ["fujiya-nectar-peach", "sanpellegrino-aranciata", "kimino-yuzu"], { daypart: "evening" }),
  story("summer-hot", "summer", "夏の昼", ["冷房の部屋。", "柑橘と桃。"], ["kimino-yuzu", "fujiya-nectar-peach", "sanpellegrino-aranciata"], { weather: "hot" }),
  story("summer-hot-b", "summer", "夏の昼", ["汗が引いたら。", "柑橘を開ける。"], ["sanpellegrino-aranciata", "kimino-yuzu", "fujiya-nectar-peach"], { weather: "hot" }),
  story("summer-rain", "summer", "夏の雨", ["にわか雨のあと。", "桃の炭酸を。"], ["fujiya-sparkling-peach", "fujiya-nectar-peach", "kimino-ume"], { weather: "rain" }),
  story("summer-cold", "summer", "冷えた部屋", ["冷房が強い。", "しょうがを一本。"], ["kodama-ginger-250", "kimino-yuzu", "suntory-oolong-340"], { weather: "cold" }),
  story("summer-mild", "summer", "夏の昼下がり", ["風のある席。", "白桃を置く。"], ["fujiya-sparkling-peach", "fujiya-nectar-peach", "suntory-oolong-340"], { weather: "mild" }),
  story("summer-hot-okinawa", "summer", "沖縄の夏", ["熱が残る街。", "冷えた柑橘。"], ["kimino-yuzu", "sanpellegrino-aranciata", "maison-perrier-lime-ginger-330"], { weather: "hot", region: "okinawa" }),
  story("summer-hot-kanto", "summer", "関東の夏", ["暑い昼の席。", "冷えた柑橘。"], ["kimino-yuzu", "sanpellegrino-aranciata", "fujiya-nectar-peach"], { weather: "hot", region: "kanto" }),
  story("summer-rain-kyushu", "summer", "九州の雨", ["夕立のあと。", "烏龍茶と桃。"], ["fujiya-nectar-peach", "suntory-oolong-340", "fujiya-sparkling-peach"], { weather: "rain", region: "kyushu" }),
  story("winter-afternoon", "winter", "冬の午後", ["会議のあと。", "みかんを置く。"], ["kimura-mikan100-200", "kimino-yuzu", "suntory-oolong-340"], { daypart: "afternoon" }),
  story("winter-morning", "winter", "冬の朝", ["出社の一杯。", "ゆずから。"], ["kimino-yuzu", "kimura-fuji-yuzu"], { daypart: "morning" }),
  story("winter-evening", "winter", "冬の夜", ["残った席で。", "しょうがを開ける。"], ["kodama-ginger-250", "kimino-yuzu", "kimura-mikan100-200"], { daypart: "evening" }),
  story("winter-evening-b", "winter", "冬の夜", ["帰る前の席。", "ゆずを合わせる。"], ["kimino-yuzu", "kimura-fuji-yuzu", "kodama-ginger-250"], { daypart: "evening" }),
  story("winter-cold", "winter", "冬の冷え", ["部屋は暖かい。", "ゆずとしょうが。"], ["kimino-yuzu", "kodama-ginger-250", "kimura-mikan100-200"], { weather: "cold" }),
  story("winter-cold-b", "winter", "冬の冷え", ["窓が白い日。", "みかんの瓶。"], ["kimura-mikan100-200", "kimino-yuzu", "kodama-ginger-250"], { weather: "cold" }),
  story("winter-rain", "winter", "冬の雨", ["冷たい雨。", "しょうがとゆず。"], ["kodama-ginger-250", "kimino-yuzu", "suntory-oolong-340"], { weather: "rain" }),
  story("winter-hot", "winter", "暖かい部屋", ["暖房が強い日。", "柑橘を冷やす。"], ["kimino-yuzu", "sanpellegrino-aranciata", "kimura-mikan100-200"], { weather: "hot" }),
  story("winter-mild", "winter", "穏やかな冬", ["風のない午後。", "みかんとお茶。"], ["kimura-mikan100-200", "suntory-oolong-340", "kimino-yuzu"], { weather: "mild" }),
  story("winter-cold-hokkaido", "winter", "北海道の冬", ["雪の日の席。", "ゆずとしょうが。"], ["kimino-yuzu", "kodama-ginger-250", "kimura-mikan100-200"], { weather: "cold", region: "hokkaido" }),
  story("winter-cold-tohoku", "winter", "東北の冬", ["日が短い夕方。", "みかんを開ける。"], ["kimura-mikan100-200", "kimino-yuzu", "kodama-ginger-250"], { weather: "cold", region: "tohoku" }),
  story("winter-mild-kanto", "winter", "関東の冬", ["乾いた午後。", "ゆずを置く。"], ["kimino-yuzu", "kimura-fuji-yuzu", "suntory-oolong-340"], { weather: "mild", region: "kanto" }),
  story("spring-afternoon", "spring", "春の昼", ["短い会議のあと。", "白桃を開ける。"], ["fujiya-sparkling-peach", "fujiya-nectar-peach", "kimura-momo-cider"], { daypart: "afternoon" }),
  story("spring-morning", "spring", "春の朝", ["新しい期の朝。", "梅から始める。"], ["kimino-ume", "fujiya-nectar-peach", "suntory-oolong-340"], { daypart: "morning" }),
  story("spring-evening", "spring", "春の夜", ["残った三人。", "梅と桃。"], ["kimino-ume", "kimura-momo-cider"], { daypart: "evening" }),
  story("spring-mild", "spring", "春の午後", ["新しい顔合わせ。", "白桃と梅。"], ["fujiya-nectar-peach", "kimino-ume", "kimura-momo-cider"], { weather: "mild" }),
  story("spring-mild-b", "spring", "春の午後", ["窓を開ける日。", "桃の瓶を。"], ["kimura-momo-cider", "fujiya-sparkling-peach", "kimino-ume"], { weather: "mild" }),
  story("spring-rain", "spring", "春の雨", ["花曇りの席。", "梅を置く。"], ["kimino-ume", "fujiya-nectar-peach", "suntory-oolong-340"], { weather: "rain" }),
  story("spring-hot", "spring", "暖かい春", ["少し暑い日。", "桃の炭酸。"], ["fujiya-sparkling-peach", "fujiya-nectar-peach", "sanpellegrino-aranciata"], { weather: "hot" }),
  story("spring-cold", "spring", "寒い春", ["まだコートの日。", "ゆずと梅。"], ["kimino-yuzu", "kimino-ume", "kodama-ginger-250"], { weather: "cold" }),
  story("spring-rain-kanto", "spring", "関東の春雨", ["花の雨。", "梅を真ん中に。"], ["kimino-ume", "fujiya-nectar-peach", "kimura-momo-cider"], { weather: "rain", region: "kanto" }),
];

export function storyById(id: string): VisitStory | undefined {
  return STORIES.find((item) => item.id === id);
}

export function defaultStory(): VisitStory {
  const story = storyById(DEFAULT_STORY_ID);
  if (!story) {
    throw new Error("default visit story missing");
  }
  return story;
}

/** Month in Asia/Tokyo. Same calendar as the seasonal shelf. */
export function seasonOf(date: Date): Season {
  const month = Number(new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone: "Asia/Tokyo" }).format(date));
  if (month >= 3 && month <= 5) {
    return "spring";
  }
  if (month >= 6 && month <= 8) {
    return "summer";
  }
  if (month >= 9 && month <= 11) {
    return "autumn";
  }
  return "winter";
}

export function daypartOf(date: Date, timeZone = "Asia/Tokyo"): Daypart {
  let hour: number;
  try {
    hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(date));
  } catch {
    hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Tokyo" }).format(date));
  }
  if (!Number.isFinite(hour)) {
    return "afternoon";
  }
  if (hour >= 5 && hour < 11) {
    return "morning";
  }
  if (hour >= 11 && hour < 17) {
    return "afternoon";
  }
  return "evening";
}

function isWetCode(code: number): boolean {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);
}

/** Rain wins over temperature. Hot and cold are the remaining office-day buckets. */
export function weatherBucket(temperature: number, precipitation: number, code: number): Weather {
  if (precipitation >= 0.2 || isWetCode(code)) {
    return "rain";
  }
  if (temperature >= 26) {
    return "hot";
  }
  if (temperature <= 12) {
    return "cold";
  }
  return "mild";
}

function normalizeName(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const name = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
  return name || undefined;
}

function normalizeCode(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const stripped = value.toUpperCase().replace(/^JP-/, "");
  if (!/^\d{1,2}$/.test(stripped)) {
    return undefined;
  }
  return stripped.padStart(2, "0");
}

/** Japanese prefecture from request.cf. Anywhere else stays unset. */
export function regionFromCf(country?: string, region?: string, regionCode?: string): Region | undefined {
  if (country && country.toUpperCase() !== "JP") {
    return undefined;
  }
  const code = normalizeCode(regionCode);
  if (code) {
    const fromCode = PREFECTURE_CODE[code];
    if (fromCode) {
      return fromCode;
    }
  }
  const name = normalizeName(region);
  if (!name) {
    return undefined;
  }
  return PREFECTURE_REGION[name];
}

function specificity(item: VisitStory): number {
  return (item.region ? 4 : 0) + (item.weather ? 2 : 0) + (item.daypart ? 1 : 0);
}

function matches(item: VisitStory, query: VisitQuery): boolean {
  if (item.season !== query.season) {
    return false;
  }
  if (item.region && item.region !== query.region) {
    return false;
  }
  if (item.weather && item.weather !== query.weather) {
    return false;
  }
  if (item.daypart && item.daypart !== query.daypart) {
    return false;
  }
  return true;
}

/** Most specific season × weather × region story. Ties are random. */
export function resolveVisit(query: VisitQuery): VisitStory {
  if (query.storyId) {
    const requested = storyById(query.storyId);
    if (requested) {
      return requested;
    }
  }
  const pool = STORIES.filter((item) => matches(item, query));
  const best = pool.reduce((score, item) => Math.max(score, specificity(item)), -1);
  const top = pool.filter((item) => specificity(item) === best);
  if (top.length === 0) {
    return defaultStory();
  }
  const roll = query.random ?? Math.random;
  const index = Math.min(top.length - 1, Math.floor(roll() * top.length));
  return top[index] ?? defaultStory();
}
