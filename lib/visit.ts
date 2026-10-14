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
  story("autumn-afternoon", "autumn", "秋の午後", ["会議が終わったあとに出すドリンクです。", "りんごと白桃に、烏龍茶を一本混ぜるのがおすすめです。甘いものが苦手な人も飲めます。"], ["kimino-ringo", "fujiya-sparkling-peach", "suntory-oolong-340"], { daypart: "afternoon" }),
  story("autumn-afternoon-b", "autumn", "秋の午後", ["午後の短い休憩に出すなら、この三本です。", "ぶどうを特別な一本にして、烏龍茶を添えると安心です。"], ["kimura-shine-muscat", "kimura-akafuji", "suntory-oolong-340"], { daypart: "afternoon" }),
  story("autumn-morning", "autumn", "秋の朝", ["出社したての朝、会議の前に配るドリンクです。", "烏龍茶とりんごの缶と小瓶なら、席に置いても邪魔になりません。"], ["kimino-ringo", "suntory-oolong-340", "aoren-shun-ringo-195"], { daypart: "morning" }),
  story("autumn-evening", "autumn", "秋の夜", ["残業で残った数人に出すドリンクです。", "りんごと白桃を開けて、ぶどうを真ん中に置くと話が続きます。"], ["kimino-ringo", "fujiya-sparkling-peach", "kimura-yamanashi-budo"], { daypart: "evening" }),
  story("autumn-evening-b", "autumn", "秋の夜", ["夜まで仕事が残っている人の分です。", "白桃は甘いものが欲しい人に、梅と烏龍茶はそれ以外の人に回すと安心です。"], ["fujiya-sparkling-peach", "kimino-ume", "suntory-oolong-340"], { daypart: "evening" }),
  story("autumn-rain", "autumn", "雨の日", ["雨で買い出しに行けない日のドリンクです。", "手元の烏龍茶とぶどうを出せば足ります。"], ["kimura-akafuji", "suntory-oolong-340", "kimura-shine-muscat"], { weather: "rain" }),
  story("autumn-rain-b", "autumn", "雨の日", ["雨で外に出ない午後は、この三本で足ります。", "ぶどうの瓶を一本混ぜると、烏龍茶だけより話が続きます。"], ["kimura-yamanashi-budo", "kimura-akafuji", "suntory-oolong-340"], { weather: "rain" }),
  story("autumn-cold", "autumn", "冷える夕方", ["冷える夕方は、りんごだけだと味が一つになります。", "しょうがの香りの瓶と烏龍茶を混ぜると、味に違いが出ます。"], ["kodama-ginger-250", "kimino-ringo", "suntory-oolong-340"], { weather: "cold" }),
  story("autumn-cold-b", "autumn", "冷える夕方", ["りんごの缶を人数分にして、瓶は共有にすると安心です。", "缶はそのまま渡せます。しょうがの瓶は、甘いりんごとは香りが違う一本です。"], ["kimino-ringo", "kodama-ginger-250", "aoren-shun-ringo-195"], { weather: "cold" }),
  story("autumn-hot", "autumn", "残暑", ["残暑の午後は、冷やした柑橘と桃がおすすめです。", "常温のまま並べると、誰も手を伸ばしません。"], ["kimino-yuzu", "sanpellegrino-aranciata", "fujiya-nectar-peach"], { weather: "hot" }),
  story("autumn-hot-b", "autumn", "残暑", ["冷房のきいた部屋でも、飲むものは冷たいまま出すと安心です。", "ぬるい柑橘は、飲み残されます。"], ["kimino-yuzu", "sanpellegrino-aranciata", "maison-perrier-lime-ginger-330"], { weather: "hot" }),
  story("autumn-mild", "autumn", "穏やかな午後", ["午後の集まりには、甘い瓶と烏龍茶の両方がおすすめです。", "白桃とりんごだけだと、甘いものが苦手な人が困ります。"], ["fujiya-sparkling-peach", "kimino-ringo", "suntory-oolong-340"], { weather: "mild" }),
  story("autumn-mild-b", "autumn", "穏やかな午後", ["席に戻るまでの短い休憩に出すドリンクです。", "小瓶と缶なら、休憩のうちに飲み切れます。"], ["kimino-ume", "kimino-ringo", "suntory-oolong-340"], { weather: "mild" }),
  story("autumn-rain-kanto", "autumn", "関東の雨", ["関東は雨で、買い足しに行けません。", "ぶどうを真ん中に置いて、烏龍茶の缶を配るのがおすすめです。"], ["kimura-akafuji", "kimura-yamanashi-budo", "suntory-oolong-340"], { weather: "rain", region: "kanto" }),
  story("autumn-rain-kanto-b", "autumn", "関東の雨", ["濡れて戻った人には、すぐ渡せる烏龍茶の缶を先に出すと安心です。", "ぶどうの瓶は、話が始まってから開けると盛り上がります。"], ["kimura-shine-muscat", "suntory-oolong-340", "kimura-akafuji"], { weather: "rain", region: "kanto" }),
  story("autumn-cold-hokkaido", "autumn", "北海道の冷え", ["北海道の寒い日は、りんごの缶を人数分にするのがおすすめです。", "しょうがの瓶を一本混ぜると、甘いりんごだけになりません。"], ["kodama-ginger-250", "kimino-ringo", "aoren-shun-ringo-195"], { weather: "cold", region: "hokkaido" }),
  story("autumn-cold-hokkaido-b", "autumn", "北海道の冷え", ["北海道では、缶と瓶で渡し方を分けると安心です。", "りんごの缶は人数分、炭酸としょうがの瓶はテーブルの共有です。"], ["aoren-shun-ringo-195", "kimino-ringo", "kodama-ginger-250"], { weather: "cold", region: "hokkaido" }),
  story("autumn-cold-tohoku", "autumn", "東北の夕方", ["東北の夕方は、りんごの缶を先に人数分そろえるのがおすすめです。", "しょうがの瓶は、甘いりんごだけでは物足りない人の分です。"], ["aoren-shun-ringo-195", "kimino-ringo", "kodama-ginger-250"], { weather: "cold", region: "tohoku" }),
  story("autumn-mild-kansai", "autumn", "関西の午後", ["関西の昼の会議のあとは、白桃を人数分にするのがおすすめです。", "白桃が一本ずつあると取り合いにならず、烏龍茶は甘いものが苦手な人の分です。"], ["fujiya-sparkling-peach", "kimino-ringo", "suntory-oolong-340"], { weather: "mild", region: "kansai" }),
  story("autumn-hot-okinawa", "autumn", "沖縄の残暑", ["沖縄はまだ暑いので、冷やした柑橘と桃がおすすめです。", "常温のまま出すと、誰も開けません。"], ["kimino-yuzu", "sanpellegrino-aranciata", "fujiya-nectar-peach"], { weather: "hot", region: "okinawa" }),
  story("autumn-rain-kyushu", "autumn", "九州の雨", ["九州の雨の日は、外に買いに行かなくて大丈夫です。", "烏龍茶とぶどうを出せば足ります。"], ["kimura-akafuji", "suntory-oolong-340", "kimura-shine-muscat"], { weather: "rain", region: "kyushu" }),
  story("autumn-mild-chubu", "autumn", "甲信の午後", ["甲信の集まりでは、山梨と信州のぶどうを混ぜるのがおすすめです。", "同じぶどうでも産地で味が違うので、話が続きます。"], ["kimura-akafuji", "kimura-yamanashi-budo", "kimura-shine-muscat"], { weather: "mild", region: "chubu" }),
  story("autumn-hot-kanto", "autumn", "関東の残暑", ["関東の残暑では、冷たい柑橘を先に出すのがおすすめです。", "烏龍茶は、甘いものが苦手な人の分です。"], ["kimino-yuzu", "sanpellegrino-aranciata", "suntory-oolong-340"], { weather: "hot", region: "kanto" }),
  story("autumn-rain-chugoku", "autumn", "中国地方の雨", ["中国地方の雨の日は、買い足しに出ずにこの三本で足ります。", "烏龍茶と梅を基本に、ぶどうを特別な一本にすると盛り上がります。"], ["kimura-yamanashi-budo", "suntory-oolong-340", "kimino-ume"], { weather: "rain", region: "chugoku" }),
  story("autumn-mild-shikoku", "autumn", "四国の午後", ["四国の午後は、ゆずを二種類出すのがおすすめです。", "同じゆずでも違いが話の種になります。柑橘の炭酸も一本添えると安心です。"], ["kimino-yuzu", "kimura-fuji-yuzu", "sanpellegrino-aranciata"], { weather: "mild", region: "shikoku" }),
  story("summer-afternoon", "summer", "夏の午後", ["夏の会議の合間は、桃を人数分にするのがおすすめです。", "一本ずつあると、取り合いになりません。"], ["fujiya-nectar-peach", "fujiya-sparkling-peach", "sanpellegrino-aranciata"], { daypart: "afternoon" }),
  story("summer-afternoon-b", "summer", "夏の午後", ["長い昼休みは、甘い桃を全員の分にしなくていいです。", "ライムの瓶は甘さが弱いので先に出すと安心です。桃は欲しい人だけにします。"], ["maison-perrier-lime-ginger-330", "sanpellegrino-aranciata", "fujiya-nectar-peach"], { daypart: "afternoon" }),
  story("summer-morning", "summer", "夏の朝", ["出社した直後、朝の会議の前に渡すドリンクです。", "冷えたゆずの小瓶なら、会議が始まるまでに飲み切れます。"], ["kimino-yuzu", "maison-perrier-lime-ginger-330"], { daypart: "morning" }),
  story("summer-evening", "summer", "夏の夜", ["残業のあとは、冷やした桃と柑橘がおすすめです。", "ぬるいと、誰も開けません。"], ["fujiya-nectar-peach", "sanpellegrino-aranciata", "kimino-yuzu"], { daypart: "evening" }),
  story("summer-hot", "summer", "夏の昼", ["冷房の部屋でも、冷やした柑橘と桃がおすすめです。", "買ったときの冷たさのまま並べると、すぐ手に取ってもらえます。"], ["kimino-yuzu", "fujiya-nectar-peach", "sanpellegrino-aranciata"], { weather: "hot" }),
  story("summer-hot-b", "summer", "夏の昼", ["汗をかいて戻った人には、冷えた柑橘を先に出すと安心です。", "とろみのある桃は、二本目にすると飲みやすいです。"], ["sanpellegrino-aranciata", "kimino-yuzu", "fujiya-nectar-peach"], { weather: "hot" }),
  story("summer-rain", "summer", "夏の雨", ["にわか雨で外に出られないときは、買い足しは不要です。", "桃の炭酸と梅で足ります。"], ["fujiya-sparkling-peach", "fujiya-nectar-peach", "kimino-ume"], { weather: "rain" }),
  story("summer-cold", "summer", "冷えた部屋", ["冷房が強い部屋では、甘い柑橘だけにしない方が安心です。", "しょうがの香りの瓶を混ぜ、烏龍茶は仕事に戻る人の分です。"], ["kodama-ginger-250", "kimino-yuzu", "suntory-oolong-340"], { weather: "cold" }),
  story("summer-mild", "summer", "夏の昼下がり", ["昼下がりは、仕事に戻る人がまだいます。", "白桃の炭酸を出して、烏龍茶は甘いものが苦手な人に回すのがおすすめです。"], ["fujiya-sparkling-peach", "fujiya-nectar-peach", "suntory-oolong-340"], { weather: "mild" }),
  story("summer-hot-okinawa", "summer", "沖縄の夏", ["沖縄の暑さでは、常温のまま出さない方が安心です。", "冷やした柑橘だけを並べます。ぬるいと誰も開けません。"], ["kimino-yuzu", "sanpellegrino-aranciata", "maison-perrier-lime-ginger-330"], { weather: "hot", region: "okinawa" }),
  story("summer-hot-kanto", "summer", "関東の夏", ["関東の暑い昼は、冷えた柑橘を先に出すのがおすすめです。", "桃は、甘いものが欲しい人の分です。"], ["kimino-yuzu", "sanpellegrino-aranciata", "fujiya-nectar-peach"], { weather: "hot", region: "kanto" }),
  story("summer-rain-kyushu", "summer", "九州の雨", ["九州の夕立のあとは、外に買いに行かなくて大丈夫です。", "烏龍茶と桃を出せば足ります。"], ["fujiya-nectar-peach", "suntory-oolong-340", "fujiya-sparkling-peach"], { weather: "rain", region: "kyushu" }),
  story("winter-afternoon", "winter", "冬の午後", ["冬の会議のあとに出すドリンクです。", "みかんとゆずに、烏龍茶を一本混ぜるのがおすすめです。"], ["kimura-mikan100-200", "kimino-yuzu", "suntory-oolong-340"], { daypart: "afternoon" }),
  story("winter-morning", "winter", "冬の朝", ["冬の出社直後は、ゆずを二種類用意するのがおすすめです。", "好みで選べるので、同じものを人数分買うより話が続きます。"], ["kimino-yuzu", "kimura-fuji-yuzu"], { daypart: "morning" }),
  story("winter-evening", "winter", "冬の夜", ["残業で残った人には、甘いみかんだけだと飽きる人が出ます。", "しょうがの瓶を先に、みかんは甘みが欲しい人の分にすると安心です。"], ["kodama-ginger-250", "kimino-yuzu", "kimura-mikan100-200"], { daypart: "evening" }),
  story("winter-evening-b", "winter", "冬の夜", ["帰る前の短い時間には、小瓶がおすすめです。", "ゆずとしょうがなら、席を立つまでに飲み切れます。"], ["kimino-yuzu", "kimura-fuji-yuzu", "kodama-ginger-250"], { daypart: "evening" }),
  story("winter-cold", "winter", "冬の冷え", ["よく冷えた日は、冷たい炭酸だけにしない方が安心です。", "ゆずとしょうがに、炭酸のないみかん果汁を混ぜます。"], ["kimino-yuzu", "kodama-ginger-250", "kimura-mikan100-200"], { weather: "cold" }),
  story("winter-cold-b", "winter", "冬の冷え", ["寒い日は、みかんの果汁を真ん中に置くのがおすすめです。", "炭酸のゆずとしょうがは、炭酸が欲しい人の分です。"], ["kimura-mikan100-200", "kimino-yuzu", "kodama-ginger-250"], { weather: "cold" }),
  story("winter-rain", "winter", "冬の雨", ["冷たい雨の日は、買い足しに出さずこの三本で足ります。", "しょうがとゆずを出して、烏龍茶は仕事に戻る人に残すと安心です。"], ["kodama-ginger-250", "kimino-yuzu", "suntory-oolong-340"], { weather: "rain" }),
  story("winter-hot", "winter", "暖かい部屋", ["暖房が強い部屋では、冷やした柑橘がおすすめです。", "ぬるいと甘さばかり感じます。"], ["kimino-yuzu", "sanpellegrino-aranciata", "kimura-mikan100-200"], { weather: "hot" }),
  story("winter-mild", "winter", "穏やかな冬", ["寒さが緩んだ日は、みかんと烏龍茶が基本です。", "ゆずは一本だけ、特別な瓶として置くと安心です。"], ["kimura-mikan100-200", "suntory-oolong-340", "kimino-yuzu"], { weather: "mild" }),
  story("winter-cold-hokkaido", "winter", "北海道の冬", ["北海道の雪の日は、外に買いに行けません。", "ゆず、しょうが、みかんを、集まった人数の分だけ出すと安心です。"], ["kimino-yuzu", "kodama-ginger-250", "kimura-mikan100-200"], { weather: "cold", region: "hokkaido" }),
  story("winter-cold-tohoku", "winter", "東北の冬", ["東北の寒い夕方は、みかんを人数分用意すると安心です。", "しょうがは共有の一本なので、欲しい人が取れます。"], ["kimura-mikan100-200", "kimino-yuzu", "kodama-ginger-250"], { weather: "cold", region: "tohoku" }),
  story("winter-mild-kanto", "winter", "関東の冬", ["関東の冬の午後は、ゆずを二種類出すのがおすすめです。", "烏龍茶は、仕事中の人の分です。"], ["kimino-yuzu", "kimura-fuji-yuzu", "suntory-oolong-340"], { weather: "mild", region: "kanto" }),
  story("spring-afternoon", "spring", "春の昼", ["春の会議のあとは、桃の炭酸と桃の瓶を一緒に出すのがおすすめです。", "炭酸と果汁で味が違うので、話が続きます。"], ["fujiya-sparkling-peach", "fujiya-nectar-peach", "kimura-momo-cider"], { daypart: "afternoon" }),
  story("spring-morning", "spring", "春の朝", ["春の出社直後で、初対面の人がいるときです。", "梅と白桃は渡しやすく、烏龍茶は甘いものが苦手な人の分です。"], ["kimino-ume", "fujiya-nectar-peach", "suntory-oolong-340"], { daypart: "morning" }),
  story("spring-evening", "spring", "春の夜", ["残った三人には、瓶が二本で足ります。", "梅と桃を分ければ、全員に行き渡ります。"], ["kimino-ume", "kimura-momo-cider"], { daypart: "evening" }),
  story("spring-mild", "spring", "春の午後", ["顔合わせでは、お酒を飲まない人もいます。", "白桃と梅なら、誰に渡しても困りません。"], ["fujiya-nectar-peach", "kimino-ume", "kimura-momo-cider"], { weather: "mild" }),
  story("spring-mild-b", "spring", "春の午後", ["春の午後の休憩には、桃の瓶を特別な一本にするのがおすすめです。", "梅は人数分置くと、取り合いになりません。"], ["kimura-momo-cider", "fujiya-sparkling-peach", "kimino-ume"], { weather: "mild" }),
  story("spring-rain", "spring", "春の雨", ["春の雨で外に出ない日は、この三本で足ります。", "梅と白桃を出して、烏龍茶は仕事に戻る人に残すと安心です。"], ["kimino-ume", "fujiya-nectar-peach", "suntory-oolong-340"], { weather: "rain" }),
  story("spring-hot", "spring", "暖かい春", ["少し暑い春の日は、冷やした桃の炭酸がおすすめです。", "常温だと甘さばかり感じます。"], ["fujiya-sparkling-peach", "fujiya-nectar-peach", "sanpellegrino-aranciata"], { weather: "hot" }),
  story("spring-cold", "spring", "寒い春", ["まだ寒い朝は、甘い梅だけにしない方が安心です。", "ゆずと、しょうがの香りの瓶を一本混ぜます。"], ["kimino-yuzu", "kimino-ume", "kodama-ginger-250"], { weather: "cold" }),
  story("spring-rain-kanto", "spring", "関東の春雨", ["関東の春の雨の日は、戻った人がすぐ取れる場所に置くと安心です。", "梅と桃を真ん中に出すと、そこから各自が取れます。"], ["kimino-ume", "fujiya-nectar-peach", "kimura-momo-cider"], { weather: "rain", region: "kanto" }),
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
