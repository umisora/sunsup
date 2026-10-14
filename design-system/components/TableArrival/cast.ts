export type ArrivalStand = "full" | "can";

export type ArrivalToast = "left" | "right";

export type TableCast = {
  slug: string;
  name: string;
  src: string;
  stand: ArrivalStand;
  /** Intrinsic size and the non-white content box of public/drinks/{slug}.webp. */
  frame: {
    nw: number;
    nh: number;
    l: number;
    t: number;
    cw: number;
    ch: number;
  };
};

/**
 * Stills that can stand on the office table. Crop boxes are measured from public/drinks.
 * White corners, so mix-blend-mode: multiply knocks the background out.
 */
export const TABLE_CAST: Readonly<Record<string, TableCast>> = {
  "kimino-yuzu": {
    slug: "kimino-yuzu",
    name: "KIMINO YUZUスパークリングジュース",
    src: "/drinks/kimino-yuzu.webp",
    stand: "full",
    frame: { nw: 1000, nh: 1000, l: 351, t: 103, cw: 405, ch: 834 },
  },
  "kimino-ringo": {
    slug: "kimino-ringo",
    name: "KIMINO RINGOスパークリングジュース",
    src: "/drinks/kimino-ringo.webp",
    stand: "full",
    frame: { nw: 1100, nh: 1100, l: 383, t: 113, cw: 455, ch: 920 },
  },
  "kimino-ume": {
    slug: "kimino-ume",
    name: "KIMINO UMEスパークリングジュース",
    src: "/drinks/kimino-ume.webp",
    stand: "full",
    frame: { nw: 1100, nh: 1100, l: 385, t: 118, cw: 451, ch: 919 },
  },
  "fujiya-nectar-peach": {
    slug: "fujiya-nectar-peach",
    name: "不二家ネクターピーチ",
    src: "/drinks/fujiya-nectar-peach.webp",
    stand: "can",
    frame: { nw: 350, nh: 350, l: 92, t: 25, cw: 164, ch: 310 },
  },
  "fujiya-sparkling-peach": {
    slug: "fujiya-sparkling-peach",
    name: "ネクタースパークリング 白桃＆シャルドネ 380ml",
    src: "/drinks/fujiya-sparkling-peach.webp",
    stand: "full",
    frame: { nw: 750, nh: 750, l: 248, t: 49, cw: 255, ch: 650 },
  },
  "sanpellegrino-aranciata": {
    slug: "sanpellegrino-aranciata",
    name: "サンペレグリノ アランチャータ",
    src: "/drinks/sanpellegrino-aranciata.webp",
    stand: "full",
    frame: { nw: 380, nh: 1000, l: 0, t: 1, cw: 380, ch: 998 },
  },
  "suntory-oolong-340": {
    slug: "suntory-oolong-340",
    name: "サントリー烏龍茶",
    src: "/drinks/suntory-oolong-340.webp",
    stand: "can",
    frame: { nw: 528, nh: 1000, l: 0, t: 0, cw: 528, ch: 1000 },
  },
  "kimura-akafuji": {
    slug: "kimura-akafuji",
    name: "赤富士サイダー 240ml",
    src: "/drinks/kimura-akafuji.webp",
    stand: "full",
    frame: { nw: 750, nh: 750, l: 287, t: 32, cw: 180, ch: 684 },
  },
  "kimura-shine-muscat": {
    slug: "kimura-shine-muscat",
    name: "シャインマスカットサイダー 240ml",
    src: "/drinks/kimura-shine-muscat.webp",
    stand: "full",
    frame: { nw: 750, nh: 750, l: 275, t: 31, cw: 199, ch: 688 },
  },
  "kimura-yamanashi-budo": {
    slug: "kimura-yamanashi-budo",
    name: "山梨ぶどうサイダー 240ml",
    src: "/drinks/kimura-yamanashi-budo.webp",
    stand: "full",
    frame: { nw: 750, nh: 750, l: 282, t: 28, cw: 190, ch: 687 },
  },
  "kimura-mikan100-200": {
    slug: "kimura-mikan100-200",
    name: "静岡県産みかん100% 200ml",
    src: "/drinks/kimura-mikan100-200.webp",
    stand: "full",
    frame: { nw: 750, nh: 750, l: 281, t: 34, cw: 180, ch: 684 },
  },
  "kimura-momo-cider": {
    slug: "kimura-momo-cider",
    name: "完熟ももサイダー 240ml",
    src: "/drinks/kimura-momo-cider.webp",
    stand: "full",
    frame: { nw: 750, nh: 750, l: 280, t: 27, cw: 189, ch: 705 },
  },
  "kimura-fuji-yuzu": {
    slug: "kimura-fuji-yuzu",
    name: "富士山ゆずサイダー 240ml",
    src: "/drinks/kimura-fuji-yuzu.webp",
    stand: "full",
    frame: { nw: 750, nh: 750, l: 286, t: 32, cw: 180, ch: 688 },
  },
  "kodama-ginger-250": {
    slug: "kodama-ginger-250",
    name: "コダマジンジャーエール 250ml",
    src: "/drinks/kodama-ginger-250.webp",
    stand: "full",
    frame: { nw: 1000, nh: 1000, l: 319, t: 14, cw: 357, ch: 972 },
  },
  "maison-perrier-lime-ginger-330": {
    slug: "maison-perrier-lime-ginger-330",
    name: "メゾンペリエ ライムジンジャー 330ml",
    src: "/drinks/maison-perrier-lime-ginger-330.webp",
    stand: "can",
    frame: { nw: 1000, nh: 1000, l: 318, t: 40, cw: 362, ch: 915 },
  },
  "aoren-shun-ringo-195": {
    slug: "aoren-shun-ringo-195",
    name: "JAアオレン 旬の林檎 密閉搾り 195g",
    src: "/drinks/aoren-shun-ringo-195.webp",
    stand: "can",
    frame: { nw: 432, nh: 376, l: 142, t: 28, cw: 150, ch: 320 },
  },
};
