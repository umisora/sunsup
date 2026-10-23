export type PhotoName = "table" | "place" | "office" | "detail" | "peak" | "peak-wide" | "scene-bonenkai" | "scene-kaisha" | "scene-kansougeikai" | "scene-sashiire" | "scene-nomanai-hito" | "category-citrus";

type PhotoSpec = {
  widths: readonly number[];
  width: number;
  height: number;
  alt: string;
};

/** Every still life on the site. Files live in public/images as {name}-{width}.webp. */
export const PHOTOS: Record<PhotoName, PhotoSpec> = {
  table: {
    widths: [768, 1280],
    width: 1280,
    height: 720,
    alt: "窓のあるオフィスの長いテーブルです。リネンの上に、緑のガラス瓶と小さめの缶、グレープフルーツを添えた炭酸のグラスが並んでいます。",
  },
  place: {
    widths: [720, 1152],
    width: 1152,
    height: 864,
    alt: "明るいオフィスの会議テーブルに、緑のガラス瓶が並んでいます。",
  },
  office: {
    widths: [768, 1280],
    width: 1280,
    height: 720,
    alt: "デスクのまわりに、緑のガラス瓶と炭酸のグラスが二つ置いてあります。",
  },
  detail: {
    widths: [720, 1152],
    width: 1152,
    height: 864,
    alt: "リネンの上に、炭酸のグラス、半分のグレープフルーツ、ぶどう、真鍮の栓抜きがあります。",
  },
  peak: {
    widths: [560, 864],
    width: 864,
    height: 1152,
    alt: "緑のガラス瓶と、グレープフルーツを添えた炭酸のグラスが、リネンの上にあります。",
  },
  "peak-wide": {
    widths: [960, 1280],
    width: 1280,
    height: 720,
    alt: "リネンのテーブルに、緑のガラス瓶、グレープフルーツを添えた炭酸のグラス、真鍮の栓抜きがあります。",
  },
  /** Made by scripts/compose-scene-hero.py from the real product stills only. */
  "scene-bonenkai": {
    widths: [768, 1152],
    width: 1152,
    height: 1440,
    alt: "明るい壁の前のテーブルに、KIMINO YUZU、りんごワーク研究所のりんごジュース、WASABIジンジャーエール、メゾンペリエ ラズベリーローズの瓶が並んでいます。",
  },
  "scene-kaisha": {
    widths: [768, 1152],
    width: 1152,
    height: 1440,
    alt: "秋の光が差す壁の前のテーブルに、KIMINO RINGO、POM 愛媛はれひめの缶、KIMINO MIKAN、神戸居留地 ぶどうと微炭酸の缶が並んでいます。",
  },
  "scene-kansougeikai": {
    widths: [768, 1152],
    width: 1152,
    height: 1440,
    alt: "春の淡い光の壁の前に、KIMINO UME、幕別いちごサイダー、KIMINO MOMO、完熟ももサイダーの瓶が並んでいます。",
  },
  "scene-sashiire": {
    widths: [768, 1152],
    width: 1152,
    height: 1440,
    alt: "夏の明るい壁の前に、片浦レモンサイダー、神戸居留地 レモネードソーダの缶、伊豆レモンサイダー、POM 愛媛河内晩柑の缶が並んでいます。",
  },
  "scene-nomanai-hito": {
    widths: [768, 1152],
    width: 1152,
    height: 1440,
    alt: "冬の壁の前のテーブルに、福招き猫サイダー、のだ塩サイダー、小豆島オリーブサイダー、サンペレグリノの瓶が並んでいます。",
  },
  "category-citrus": {
    widths: [768, 1152],
    width: 1152,
    height: 1440,
    alt: "夏の光が差す壁の前のテーブルに、馬路村のゆずサイダー、和ノチカラ ゆず炭酸水のペットボトル、サンペレグリノ アランチャータ・ロッサの缶、KIMINO YUZUスパークリングウォーターの缶が並んでいます。",
  },
};
