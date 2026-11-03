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
  /** Large glass bottles only, never convenience-store staples. */
  pairing?: "formal";
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
  extra?: { weather?: Weather; region?: Region; daypart?: Daypart; pairing?: "formal" },
): VisitStory {
  return { id, season, kicker, lead, slugs, ...extra };
}

export const STORIES: readonly VisitStory[] = [
  story("autumn-afternoon", "autumn", "秋の午後", ["会議が終わったあとに出すドリンクです。", "甘いものと、甘くないものを混ぜるのがおすすめです。甘いものが苦手な人も飲めます。"], ["kimino-ringo", "fujiya-sparkling-peach", "kimura-akafuji"], { daypart: "afternoon" }),
  story("autumn-afternoon-b", "autumn", "秋の午後", ["午後の短い休憩に出すなら、この三本です。", "一本だけ少し特別なものにして、甘くないものを添えると安心です。"], ["kimura-shine-muscat", "kimura-akafuji", "kimino-ume"], { daypart: "afternoon" }),
  story("autumn-morning", "autumn", "秋の朝", ["出社したての朝、会議の前に配るドリンクです。", "缶と小瓶なら、席に置いても邪魔になりません。"], ["kimino-ringo", "kimino-ume", "aoren-shun-ringo-195"], { daypart: "morning" }),
  story("autumn-evening", "autumn", "秋の夜", ["残業で残った数人に出すドリンクです。", "甘いものを開けて、香りの違う一本を真ん中に置くと話が続きます。"], ["kimino-ringo", "fujiya-sparkling-peach", "kimura-yamanashi-budo"], { daypart: "evening" }),
  story("autumn-evening-b", "autumn", "秋の夜", ["夜まで仕事が残っている人の分です。", "甘いものは欲しい人に、甘くないものはそれ以外の人に回すと安心です。"], ["fujiya-sparkling-peach", "kimino-ume", "kodama-ginger-250"], { daypart: "evening" }),
  story("autumn-rain", "autumn", "雨の日", ["雨で買い出しに行けない日のドリンクです。", "甘くないものと、果実の一本を出せば足ります。"], ["kimura-akafuji", "kimino-ume", "kimura-shine-muscat"], { weather: "rain" }),
  story("autumn-rain-b", "autumn", "雨の日", ["雨で外に出ない午後は、この三本で足ります。", "瓶を一本混ぜると、同じ味だけより話が続きます。"], ["kimura-yamanashi-budo", "kimura-akafuji", "kimura-shine-muscat"], { weather: "rain" }),
  story("autumn-cold", "autumn", "冷える夕方", ["冷える夕方は、同じ味だけだとすぐに飽きられます。", "香りの強い瓶と、甘くないものを混ぜると、味に違いが出ます。"], ["kodama-ginger-250", "kimino-ringo", "kimino-yuzu"], { weather: "cold" }),
  story("autumn-cold-b", "autumn", "冷える夕方", ["缶を人数分にして、瓶は共有にすると安心です。", "缶はそのまま渡せます。瓶は、甘いものとは香りが違う一本です。"], ["kimino-ringo", "kodama-ginger-250", "aoren-shun-ringo-195"], { weather: "cold" }),
  story("autumn-hot", "autumn", "残暑", ["残暑の午後は、よく冷えたものがおすすめです。", "常温のまま並べると、誰も手を伸ばしません。"], ["kimino-yuzu", "sanpellegrino-aranciata", "fujiya-sparkling-peach"], { weather: "hot" }),
  story("autumn-hot-b", "autumn", "残暑", ["冷房のきいた部屋でも、飲むものは冷たいまま出すと安心です。", "ぬるいものは、飲み残されます。"], ["kimino-yuzu", "sanpellegrino-aranciata", "maison-perrier-lime-ginger-330"], { weather: "hot" }),
  story("autumn-mild", "autumn", "穏やかな午後", ["午後の集まりには、甘いものと、甘くないものの両方がおすすめです。", "甘いものだけだと、苦手な人が困ります。"], ["fujiya-sparkling-peach", "kimino-ringo", "kimino-ume"], { weather: "mild" }),
  story("autumn-mild-b", "autumn", "穏やかな午後", ["席に戻るまでの短い休憩に出すドリンクです。", "小瓶と缶なら、休憩のうちに飲み切れます。"], ["kimino-ume", "kimino-ringo", "kimino-yuzu"], { weather: "mild" }),
  story("autumn-rain-kanto", "autumn", "関東の雨", ["関東は雨で、買い足しに行けません。", "瓶を真ん中に置いて、すぐ渡せるものを配るのがおすすめです。"], ["kimura-akafuji", "kimura-yamanashi-budo", "kimura-shine-muscat"], { weather: "rain", region: "kanto" }),
  story("autumn-rain-kanto-b", "autumn", "関東の雨", ["濡れて戻った人には、すぐ渡せるものを先に出すと安心です。", "瓶は、話が始まってから開けると盛り上がります。"], ["kimura-shine-muscat", "kimura-akafuji", "kimura-yamanashi-budo"], { weather: "rain", region: "kanto" }),
  story("autumn-cold-hokkaido", "autumn", "北海道の冷え", ["北海道の寒い日は、缶を人数分にするのがおすすめです。", "香りの強い瓶を一本混ぜると、甘いものだけになりません。"], ["kodama-ginger-250", "kimino-ringo", "aoren-shun-ringo-195"], { weather: "cold", region: "hokkaido" }),
  story("autumn-cold-hokkaido-b", "autumn", "北海道の冷え", ["北海道では、缶と瓶で渡し方を分けると安心です。", "缶は人数分、瓶はテーブルの共有です。"], ["aoren-shun-ringo-195", "kimino-ringo", "kodama-ginger-250"], { weather: "cold", region: "hokkaido" }),
  story("autumn-cold-tohoku", "autumn", "東北の夕方", ["東北の夕方は、缶を先に人数分そろえるのがおすすめです。", "香りの強い瓶は、甘いものだけでは物足りない人の分です。"], ["aoren-shun-ringo-195", "kimino-ringo", "kodama-ginger-250"], { weather: "cold", region: "tohoku" }),
  story("autumn-mild-kansai", "autumn", "関西の午後", ["関西の昼の会議のあとは、甘いものを人数分にするのがおすすめです。", "一本ずつあると取り合いにならず、甘くないものは苦手な人の分です。"], ["fujiya-sparkling-peach", "kimino-ringo", "kimino-ume"], { weather: "mild", region: "kansai" }),
  story("autumn-hot-okinawa", "autumn", "沖縄の残暑", ["沖縄はまだ暑いので、よく冷えたものがおすすめです。", "常温のまま出すと、誰も開けません。"], ["kimino-yuzu", "sanpellegrino-aranciata", "fujiya-sparkling-peach"], { weather: "hot", region: "okinawa" }),
  story("autumn-rain-kyushu", "autumn", "九州の雨", ["九州の雨の日は、外に買いに行かなくて大丈夫です。", "甘くないものと、果実の一本を出せば足ります。"], ["kimura-akafuji", "kimura-shine-muscat", "kimura-yamanashi-budo"], { weather: "rain", region: "kyushu" }),
  story("autumn-mild-chubu", "autumn", "甲信の午後", ["甲信の集まりでは、産地の違う果実を混ぜるのがおすすめです。", "同じ種類でも産地で味が違うので、話が続きます。"], ["kimura-akafuji", "kimura-yamanashi-budo", "kimura-shine-muscat"], { weather: "mild", region: "chubu" }),
  story("autumn-hot-kanto", "autumn", "関東の残暑", ["関東の残暑では、冷たいものを先に出すのがおすすめです。", "甘くないものは、甘いものが苦手な人の分です。"], ["kimino-yuzu", "sanpellegrino-aranciata", "maison-perrier-lime-ginger-330"], { weather: "hot", region: "kanto" }),
  story("autumn-rain-chugoku", "autumn", "中国地方の雨", ["中国地方の雨の日は、買い足しに出ずにこの三本で足ります。", "甘くないものを基本に、果実を特別な一本にすると盛り上がります。"], ["kimura-yamanashi-budo", "kimino-ume", "kimura-akafuji"], { weather: "rain", region: "chugoku" }),
  story("autumn-mild-shikoku", "autumn", "四国の午後", ["四国の午後は、香りの近いものを二種類出すのがおすすめです。", "少しの違いが話の種になります。もう一本添えると安心です。"], ["kimino-yuzu", "kimura-fuji-yuzu", "sanpellegrino-aranciata"], { weather: "mild", region: "shikoku" }),
  story("summer-afternoon", "summer", "夏の午後", ["夏の会議の合間は、冷たいものを人数分にするのがおすすめです。", "一本ずつあると、取り合いになりません。"], ["fujiya-sparkling-peach", "kimino-yuzu", "sanpellegrino-aranciata"], { daypart: "afternoon" }),
  story("summer-afternoon-b", "summer", "夏の午後", ["長い昼休みは、甘いものを全員の分にしなくていいです。", "甘さの弱いものを先に出すと安心です。甘いものは欲しい人だけにします。"], ["maison-perrier-lime-ginger-330", "sanpellegrino-aranciata", "kimino-yuzu"], { daypart: "afternoon" }),
  story("summer-morning", "summer", "夏の朝", ["出社した直後、朝の会議の前に渡すドリンクです。", "冷えた小瓶なら、会議が始まるまでに飲み切れます。"], ["kimino-yuzu", "maison-perrier-lime-ginger-330"], { daypart: "morning" }),
  story("summer-evening", "summer", "夏の夜", ["残業のあとは、よく冷えたものがおすすめです。", "ぬるいと、誰も開けません。"], ["fujiya-sparkling-peach", "sanpellegrino-aranciata", "kimino-yuzu"], { daypart: "evening" }),
  story("summer-hot", "summer", "夏の昼", ["冷房の部屋でも、よく冷えたものがおすすめです。", "買ったときの冷たさのまま並べると、すぐ手に取ってもらえます。"], ["kimino-yuzu", "fujiya-sparkling-peach", "sanpellegrino-aranciata"], { weather: "hot" }),
  story("summer-hot-b", "summer", "夏の昼", ["汗をかいて戻った人には、冷えたものを先に出すと安心です。", "甘みの強いものは、二本目にすると飲みやすいです。"], ["sanpellegrino-aranciata", "kimino-yuzu", "maison-perrier-lime-ginger-330"], { weather: "hot" }),
  story("summer-rain", "summer", "夏の雨", ["にわか雨で外に出られないときは、買い足しは不要です。", "手元の甘いものと、甘くないもので足ります。"], ["fujiya-sparkling-peach", "kimino-yuzu", "kimino-ume"], { weather: "rain" }),
  story("summer-cold", "summer", "冷えた部屋", ["冷房が強い部屋では、甘いものだけにしない方が安心です。", "香りの強い瓶を混ぜ、甘くないものは仕事に戻る人の分です。"], ["kodama-ginger-250", "kimino-yuzu", "kimino-ume"], { weather: "cold" }),
  story("summer-mild", "summer", "夏の昼下がり", ["昼下がりは、仕事に戻る人がまだいます。", "甘いものを出して、甘くないものは苦手な人に回すのがおすすめです。"], ["fujiya-sparkling-peach", "kimino-yuzu", "kimino-ume"], { weather: "mild" }),
  story("summer-hot-okinawa", "summer", "沖縄の夏", ["沖縄の暑さでは、常温のまま出さない方が安心です。", "よく冷えたものだけを並べます。ぬるいと誰も開けません。"], ["kimino-yuzu", "sanpellegrino-aranciata", "maison-perrier-lime-ginger-330"], { weather: "hot", region: "okinawa" }),
  story("summer-hot-kanto", "summer", "関東の夏", ["関東の暑い昼は、冷えたものを先に出すのがおすすめです。", "甘いものは、欲しい人の分です。"], ["kimino-yuzu", "sanpellegrino-aranciata", "maison-perrier-lime-ginger-330"], { weather: "hot", region: "kanto" }),
  story("summer-rain-kyushu", "summer", "九州の雨", ["九州の夕立のあとは、外に買いに行かなくて大丈夫です。", "甘くないものと、果実の一本を出せば足ります。"], ["fujiya-sparkling-peach", "kimino-ume", "kimino-yuzu"], { weather: "rain", region: "kyushu" }),
  story("winter-afternoon", "winter", "冬の午後", ["冬の会議のあとに出すドリンクです。", "香りの強いものと、甘くないものを一本混ぜるのがおすすめです。"], ["kimura-mikan100-200", "kimino-yuzu", "kodama-ginger-250"], { daypart: "afternoon" }),
  story("winter-morning", "winter", "冬の朝", ["冬の出社直後は、近いものを二種類用意するのがおすすめです。", "好みで選べるので、同じものを人数分買うより話が続きます。"], ["kimino-yuzu", "kimura-fuji-yuzu"], { daypart: "morning" }),
  story("winter-evening", "winter", "冬の夜", ["残業で残った人には、甘いものだけだと飽きる人が出ます。", "香りの強い瓶を先に、甘いものは甘みが欲しい人の分にすると安心です。"], ["kodama-ginger-250", "kimino-yuzu", "kimura-mikan100-200"], { daypart: "evening" }),
  story("winter-evening-b", "winter", "冬の夜", ["帰る前の短い時間には、小瓶がおすすめです。", "席を立つまでに飲み切れます。"], ["kimino-yuzu", "kimura-fuji-yuzu", "kodama-ginger-250"], { daypart: "evening" }),
  story("winter-cold", "winter", "冬の冷え", ["よく冷えた日は、冷たいものだけにしない方が安心です。", "香りの違う瓶を混ぜると、味が一つになりません。"], ["kimino-yuzu", "kodama-ginger-250", "kimura-mikan100-200"], { weather: "cold" }),
  story("winter-cold-b", "winter", "冬の冷え", ["寒い日は、果汁を真ん中に置くのがおすすめです。", "炭酸が欲しい人の分も、一本あると安心です。"], ["kimura-mikan100-200", "kimino-yuzu", "kodama-ginger-250"], { weather: "cold" }),
  story("winter-rain", "winter", "冬の雨", ["冷たい雨の日は、買い足しに出さずこの三本で足ります。", "香りの強い瓶を出して、甘くないものは仕事に戻る人に残すと安心です。"], ["kodama-ginger-250", "kimino-yuzu", "kimura-mikan100-200"], { weather: "rain" }),
  story("winter-hot", "winter", "暖かい部屋", ["暖房が強い部屋では、冷やしたものがおすすめです。", "ぬるいと甘さばかり感じます。"], ["kimino-yuzu", "sanpellegrino-aranciata", "kimura-mikan100-200"], { weather: "hot" }),
  story("winter-mild", "winter", "穏やかな冬", ["寒さが緩んだ日は、甘くないものを基本にします。", "香りのある瓶は一本だけ、特別なものとして置くと安心です。"], ["kimura-mikan100-200", "kimino-yuzu", "kodama-ginger-250"], { weather: "mild" }),
  story("winter-cold-hokkaido", "winter", "北海道の冬", ["北海道の雪の日は、外に買いに行けません。", "集まった人数の分だけ出すと安心です。"], ["kimino-yuzu", "kodama-ginger-250", "kimura-mikan100-200"], { weather: "cold", region: "hokkaido" }),
  story("winter-cold-tohoku", "winter", "東北の冬", ["東北の寒い夕方は、缶や小瓶を人数分用意すると安心です。", "香りの強い瓶は共有の一本なので、欲しい人が取れます。"], ["kimura-mikan100-200", "kimino-yuzu", "kodama-ginger-250"], { weather: "cold", region: "tohoku" }),
  story("winter-mild-kanto", "winter", "関東の冬", ["関東の冬の午後は、近いものを二種類出すのがおすすめです。", "甘くないものは、仕事中の人の分です。"], ["kimino-yuzu", "kimura-fuji-yuzu", "kodama-ginger-250"], { weather: "mild", region: "kanto" }),
  story("spring-afternoon", "spring", "春の昼", ["春の会議のあとは、味の違うものを一緒に出すのがおすすめです。", "違いがあるので、話が続きます。"], ["fujiya-sparkling-peach", "kimino-yuzu", "kimura-momo-cider"], { daypart: "afternoon" }),
  story("spring-morning", "spring", "春の朝", ["春の出社直後で、初対面の人がいるときです。", "渡しやすいものと、甘くないものを分けて置くと安心です。"], ["kimino-ume", "fujiya-sparkling-peach", "kimino-yuzu"], { daypart: "morning" }),
  story("spring-evening", "spring", "春の夜", ["残った三人には、瓶が二本で足ります。", "味を分ければ、全員に行き渡ります。"], ["kimino-ume", "kimura-momo-cider"], { daypart: "evening" }),
  story("spring-mild", "spring", "春の午後", ["顔合わせでは、ソフトドリンクを選ぶ人もいます。", "誰に渡しても困らないものを選ぶと安心です。"], ["fujiya-sparkling-peach", "kimino-ume", "kimura-momo-cider"], { weather: "mild" }),
  story("spring-mild-b", "spring", "春の午後", ["春の午後の休憩には、一本を特別なものにするのがおすすめです。", "人数分置くと、取り合いになりません。"], ["kimura-momo-cider", "fujiya-sparkling-peach", "kimino-ume"], { weather: "mild" }),
  story("spring-rain", "spring", "春の雨", ["春の雨で外に出ない日は、この三本で足ります。", "甘いものを出して、甘くないものは仕事に戻る人に残すと安心です。"], ["kimino-ume", "fujiya-sparkling-peach", "kimura-momo-cider"], { weather: "rain" }),
  story("spring-hot", "spring", "暖かい春", ["少し暑い春の日は、よく冷えたものがおすすめです。", "常温だと甘さばかり感じます。"], ["fujiya-sparkling-peach", "kimino-yuzu", "sanpellegrino-aranciata"], { weather: "hot" }),
  story("spring-cold", "spring", "寒い春", ["まだ寒い朝は、甘いものだけにしない方が安心です。", "香りの強い瓶を一本混ぜます。"], ["kimino-yuzu", "kimino-ume", "kodama-ginger-250"], { weather: "cold" }),
  story("spring-rain-kanto", "spring", "関東の春雨", ["関東の春の雨の日は、戻った人がすぐ取れる場所に置くと安心です。", "真ん中に出すと、そこから各自が取れます。"], ["kimino-ume", "fujiya-sparkling-peach", "kimura-momo-cider"], { weather: "rain", region: "kanto" }),
  story("autumn-formal", "autumn", "秋の会食", ["少人数の会食には、大きな瓶を二、三本、テーブルの真ん中に置きます。", "グラスに注いで分けると、甘いものと、甘さの弱いものを一緒に出せます。"], ["ringowork-original-720", "alps-winery-grape-1000", "nfs-tomato-720"], { daypart: "evening", pairing: "formal" }),
  story("winter-formal", "winter", "冬の会食", ["冷えた大きな瓶を、暖かい部屋の真ん中に置きます。", "グラスに少しずつ注ぐと、人数で分けられます。"], ["perrier-glass-750", "sanpellegrino-sparkling-750", "sanpellegrino-sparkling-1000"], { daypart: "evening", pairing: "formal" }),
  story("spring-formal", "spring", "春の顔合わせ", ["顔合わせの席には、大きな瓶を二、三本置きます。", "グラスに注いで分けると、ひとりひとりの好みに合わせられます。"], ["perrier-glass-750", "sanpellegrino-sparkling-750", "sanpellegrino-sparkling-1000"], { daypart: "afternoon", pairing: "formal" }),
  story("summer-formal", "summer", "夏の夕食", ["夏の夕食には、よく冷えた大きな瓶を真ん中に置きます。", "グラスに注ぐと、甘い果汁と、甘さのないものを一緒に出せます。"], ["perrier-glass-750", "sanpellegrino-sparkling-750", "sanpellegrino-sparkling-1000"], { daypart: "evening", pairing: "formal" }),
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
