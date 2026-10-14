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
  story("autumn-afternoon", "autumn", "秋の午後", ["会議が終わった午後の席です。", "りんごと白桃が向いています。"], ["kimino-ringo", "fujiya-sparkling-peach", "suntory-oolong-340"], { daypart: "afternoon" }),
  story("autumn-afternoon-b", "autumn", "秋の午後", ["日が傾く前の午後です。", "ぶどうの甘みが向いています。"], ["kimura-shine-muscat", "kimura-akafuji", "suntory-oolong-340"], { daypart: "afternoon" }),
  story("autumn-morning", "autumn", "秋の朝", ["出社したあとの朝の席です。", "りんごと烏龍茶が合います。"], ["kimino-ringo", "suntory-oolong-340", "aoren-shun-ringo-195"], { daypart: "morning" }),
  story("autumn-evening", "autumn", "秋の夜", ["残った人たちで瓶を合わせます。", "りんごと白桃が向いています。"], ["kimino-ringo", "fujiya-sparkling-peach", "kimura-yamanashi-budo"], { daypart: "evening" }),
  story("autumn-evening-b", "autumn", "秋の夜", ["明かりの下の夜の席です。", "白桃と梅を真ん中に置けます。"], ["fujiya-sparkling-peach", "kimino-ume", "suntory-oolong-340"], { daypart: "evening" }),
  story("autumn-rain", "autumn", "雨の日", ["傘を置いたあとの席です。", "烏龍茶とぶどうが合います。"], ["kimura-akafuji", "suntory-oolong-340", "kimura-shine-muscat"], { weather: "rain" }),
  story("autumn-rain-b", "autumn", "雨の日", ["雨の日に窓を見る席です。", "ぶどうの瓶が向いています。"], ["kimura-yamanashi-budo", "kimura-akafuji", "suntory-oolong-340"], { weather: "rain" }),
  story("autumn-cold", "autumn", "冷える夕方", ["空気の冷たい夕方です。", "しょうがと烏龍茶が合います。"], ["kodama-ginger-250", "kimino-ringo", "suntory-oolong-340"], { weather: "cold" }),
  story("autumn-cold-b", "autumn", "冷える夕方", ["手が冷える夕方の席です。", "りんごの炭酸が向いています。"], ["kimino-ringo", "kodama-ginger-250", "aoren-shun-ringo-195"], { weather: "cold" }),
  story("autumn-hot", "autumn", "残暑", ["まだ暑い秋の午後です。", "冷たい柑橘と桃が合います。"], ["kimino-yuzu", "sanpellegrino-aranciata", "fujiya-nectar-peach"], { weather: "hot" }),
  story("autumn-hot-b", "autumn", "残暑", ["冷房のきいた午後の席です。", "ゆずとライムが向いています。"], ["kimino-yuzu", "sanpellegrino-aranciata", "maison-perrier-lime-ginger-330"], { weather: "hot" }),
  story("autumn-mild", "autumn", "穏やかな午後", ["風のない穏やかな午後です。", "白桃とりんごが合います。"], ["fujiya-sparkling-peach", "kimino-ringo", "suntory-oolong-340"], { weather: "mild" }),
  story("autumn-mild-b", "autumn", "穏やかな午後", ["少し席を外す午後です。", "梅とりんごで一息つけます。"], ["kimino-ume", "kimino-ringo", "suntory-oolong-340"], { weather: "mild" }),
  story("autumn-rain-kanto", "autumn", "関東の雨", ["関東は、雨が窓に当たる日です。", "ぶどうを真ん中に置けます。"], ["kimura-akafuji", "kimura-yamanashi-budo", "suntory-oolong-340"], { weather: "rain", region: "kanto" }),
  story("autumn-rain-kanto-b", "autumn", "関東の雨", ["濡れた傘のあとの席です。", "烏龍茶とぶどうが合います。"], ["kimura-shine-muscat", "suntory-oolong-340", "kimura-akafuji"], { weather: "rain", region: "kanto" }),
  story("autumn-cold-hokkaido", "autumn", "北海道の冷え", ["北海道は外が冷たい日です。", "しょうがとりんごが合います。"], ["kodama-ginger-250", "kimino-ringo", "aoren-shun-ringo-195"], { weather: "cold", region: "hokkaido" }),
  story("autumn-cold-hokkaido-b", "autumn", "北海道の冷え", ["厚い窓の向こうは冷たいです。", "りんごの缶が向いています。"], ["aoren-shun-ringo-195", "kimino-ringo", "kodama-ginger-250"], { weather: "cold", region: "hokkaido" }),
  story("autumn-cold-tohoku", "autumn", "東北の夕方", ["東北の日が落ちる夕方です。", "りんごの缶が向いています。"], ["aoren-shun-ringo-195", "kimino-ringo", "kodama-ginger-250"], { weather: "cold", region: "tohoku" }),
  story("autumn-mild-kansai", "autumn", "関西の午後", ["関西は昼の会議のあとです。", "白桃を人数分出せます。"], ["fujiya-sparkling-peach", "kimino-ringo", "suntory-oolong-340"], { weather: "mild", region: "kansai" }),
  story("autumn-hot-okinawa", "autumn", "沖縄の残暑", ["沖縄はまだ夏の暑さです。", "冷えた柑橘と桃が合います。"], ["kimino-yuzu", "sanpellegrino-aranciata", "fujiya-nectar-peach"], { weather: "hot", region: "okinawa" }),
  story("autumn-rain-kyushu", "autumn", "九州の雨", ["九州は雨のオフィスです。", "烏龍茶とぶどうが合います。"], ["kimura-akafuji", "suntory-oolong-340", "kimura-shine-muscat"], { weather: "rain", region: "kyushu" }),
  story("autumn-mild-chubu", "autumn", "甲信の午後", ["甲信はぶどうの季節です。", "山梨と信州の瓶が向いています。"], ["kimura-akafuji", "kimura-yamanashi-budo", "kimura-shine-muscat"], { weather: "mild", region: "chubu" }),
  story("autumn-hot-kanto", "autumn", "関東の残暑", ["関東は十月でも暑い午後です。", "冷たい柑橘の炭酸が合います。"], ["kimino-yuzu", "sanpellegrino-aranciata", "suntory-oolong-340"], { weather: "hot", region: "kanto" }),
  story("autumn-rain-chugoku", "autumn", "中国地方の雨", ["中国地方の曇りの席です。", "烏龍茶とぶどうが合います。"], ["kimura-yamanashi-budo", "suntory-oolong-340", "kimino-ume"], { weather: "rain", region: "chugoku" }),
  story("autumn-mild-shikoku", "autumn", "四国の午後", ["四国は瀬戸内の明るい午後です。", "ゆずの炭酸が向いています。"], ["kimino-yuzu", "kimura-fuji-yuzu", "sanpellegrino-aranciata"], { weather: "mild", region: "shikoku" }),
  story("summer-afternoon", "summer", "夏の午後", ["夏の会議の合間の席です。", "桃を人数分出せます。"], ["fujiya-nectar-peach", "fujiya-sparkling-peach", "sanpellegrino-aranciata"], { daypart: "afternoon" }),
  story("summer-afternoon-b", "summer", "夏の午後", ["長い昼休みの席です。", "ライムの缶が向いています。"], ["maison-perrier-lime-ginger-330", "sanpellegrino-aranciata", "fujiya-nectar-peach"], { daypart: "afternoon" }),
  story("summer-morning", "summer", "夏の朝", ["出社した直後の夏の朝です。", "冷えたゆずが向いています。"], ["kimino-yuzu", "maison-perrier-lime-ginger-330"], { daypart: "morning" }),
  story("summer-evening", "summer", "夏の夜", ["残業のあとの夏の夜です。", "冷たい桃と柑橘が合います。"], ["fujiya-nectar-peach", "sanpellegrino-aranciata", "kimino-yuzu"], { daypart: "evening" }),
  story("summer-hot", "summer", "夏の昼", ["冷房のきいた夏の昼です。", "柑橘と桃が向いています。"], ["kimino-yuzu", "fujiya-nectar-peach", "sanpellegrino-aranciata"], { weather: "hot" }),
  story("summer-hot-b", "summer", "夏の昼", ["汗が引いたあとの昼です。", "冷えた柑橘が向いています。"], ["sanpellegrino-aranciata", "kimino-yuzu", "fujiya-nectar-peach"], { weather: "hot" }),
  story("summer-rain", "summer", "夏の雨", ["にわか雨のあとの席です。", "桃の炭酸が向いています。"], ["fujiya-sparkling-peach", "fujiya-nectar-peach", "kimino-ume"], { weather: "rain" }),
  story("summer-cold", "summer", "冷えた部屋", ["冷房の強い夏の部屋です。", "しょうがの炭酸が合います。"], ["kodama-ginger-250", "kimino-yuzu", "suntory-oolong-340"], { weather: "cold" }),
  story("summer-mild", "summer", "夏の昼下がり", ["風のある夏の昼下がりです。", "白桃の炭酸が向いています。"], ["fujiya-sparkling-peach", "fujiya-nectar-peach", "suntory-oolong-340"], { weather: "mild" }),
  story("summer-hot-okinawa", "summer", "沖縄の夏", ["沖縄は熱の残る街です。", "冷えた柑橘が向いています。"], ["kimino-yuzu", "sanpellegrino-aranciata", "maison-perrier-lime-ginger-330"], { weather: "hot", region: "okinawa" }),
  story("summer-hot-kanto", "summer", "関東の夏", ["関東の暑い昼の席です。", "冷えた柑橘と桃が合います。"], ["kimino-yuzu", "sanpellegrino-aranciata", "fujiya-nectar-peach"], { weather: "hot", region: "kanto" }),
  story("summer-rain-kyushu", "summer", "九州の雨", ["九州は夕立のあとの席です。", "烏龍茶と桃が合います。"], ["fujiya-nectar-peach", "suntory-oolong-340", "fujiya-sparkling-peach"], { weather: "rain", region: "kyushu" }),
  story("winter-afternoon", "winter", "冬の午後", ["冬の会議が終わった席です。", "みかんとゆずが合います。"], ["kimura-mikan100-200", "kimino-yuzu", "suntory-oolong-340"], { daypart: "afternoon" }),
  story("winter-morning", "winter", "冬の朝", ["冬の朝に出社した席です。", "ゆずの炭酸が向いています。"], ["kimino-yuzu", "kimura-fuji-yuzu"], { daypart: "morning" }),
  story("winter-evening", "winter", "冬の夜", ["残った人の冬の夜です。", "しょうがとみかんが合います。"], ["kodama-ginger-250", "kimino-yuzu", "kimura-mikan100-200"], { daypart: "evening" }),
  story("winter-evening-b", "winter", "冬の夜", ["帰る前の冬の夜の席です。", "ゆずとしょうがが合います。"], ["kimino-yuzu", "kimura-fuji-yuzu", "kodama-ginger-250"], { daypart: "evening" }),
  story("winter-cold", "winter", "冬の冷え", ["部屋は暖かく、外は冷えます。", "ゆずとしょうがが合います。"], ["kimino-yuzu", "kodama-ginger-250", "kimura-mikan100-200"], { weather: "cold" }),
  story("winter-cold-b", "winter", "冬の冷え", ["窓の白い冬の日です。", "みかんの瓶が向いています。"], ["kimura-mikan100-200", "kimino-yuzu", "kodama-ginger-250"], { weather: "cold" }),
  story("winter-rain", "winter", "冬の雨", ["冷たい雨の日の席です。", "しょうがとゆずが合います。"], ["kodama-ginger-250", "kimino-yuzu", "suntory-oolong-340"], { weather: "rain" }),
  story("winter-hot", "winter", "暖かい部屋", ["暖房の強い部屋の席です。", "冷やした柑橘が合います。"], ["kimino-yuzu", "sanpellegrino-aranciata", "kimura-mikan100-200"], { weather: "hot" }),
  story("winter-mild", "winter", "穏やかな冬", ["風のない冬の午後です。", "みかんと烏龍茶が合います。"], ["kimura-mikan100-200", "suntory-oolong-340", "kimino-yuzu"], { weather: "mild" }),
  story("winter-cold-hokkaido", "winter", "北海道の冬", ["北海道の雪の日の席です。", "ゆずとしょうがが合います。"], ["kimino-yuzu", "kodama-ginger-250", "kimura-mikan100-200"], { weather: "cold", region: "hokkaido" }),
  story("winter-cold-tohoku", "winter", "東北の冬", ["東北は日の短い夕方です。", "みかんのジュースが合います。"], ["kimura-mikan100-200", "kimino-yuzu", "kodama-ginger-250"], { weather: "cold", region: "tohoku" }),
  story("winter-mild-kanto", "winter", "関東の冬", ["関東の乾いた冬の午後です。", "ゆずと烏龍茶が合います。"], ["kimino-yuzu", "kimura-fuji-yuzu", "suntory-oolong-340"], { weather: "mild", region: "kanto" }),
  story("spring-afternoon", "spring", "春の昼", ["春の短い会議のあとです。", "白桃の炭酸が向いています。"], ["fujiya-sparkling-peach", "fujiya-nectar-peach", "kimura-momo-cider"], { daypart: "afternoon" }),
  story("spring-morning", "spring", "春の朝", ["新しい期が始まる朝です。", "梅と白桃が向いています。"], ["kimino-ume", "fujiya-nectar-peach", "suntory-oolong-340"], { daypart: "morning" }),
  story("spring-evening", "spring", "春の夜", ["残った三人の春の夜です。", "梅と桃を分けて飲めます。"], ["kimino-ume", "kimura-momo-cider"], { daypart: "evening" }),
  story("spring-mild", "spring", "春の午後", ["新しい顔合わせの午後です。", "白桃と梅が向いています。"], ["fujiya-nectar-peach", "kimino-ume", "kimura-momo-cider"], { weather: "mild" }),
  story("spring-mild-b", "spring", "春の午後", ["窓を開ける春の日です。", "桃の瓶が向いています。"], ["kimura-momo-cider", "fujiya-sparkling-peach", "kimino-ume"], { weather: "mild" }),
  story("spring-rain", "spring", "春の雨", ["花曇りの春の席です。", "梅の炭酸が向いています。"], ["kimino-ume", "fujiya-nectar-peach", "suntory-oolong-340"], { weather: "rain" }),
  story("spring-hot", "spring", "暖かい春", ["少し暑い春の日です。", "桃の炭酸が向いています。"], ["fujiya-sparkling-peach", "fujiya-nectar-peach", "sanpellegrino-aranciata"], { weather: "hot" }),
  story("spring-cold", "spring", "寒い春", ["まだコートの要る春です。", "ゆずと梅が向いています。"], ["kimino-yuzu", "kimino-ume", "kodama-ginger-250"], { weather: "cold" }),
  story("spring-rain-kanto", "spring", "関東の春雨", ["関東の花の雨の日です。", "梅と桃を真ん中に置けます。"], ["kimino-ume", "fujiya-nectar-peach", "kimura-momo-cider"], { weather: "rain", region: "kanto" }),
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
