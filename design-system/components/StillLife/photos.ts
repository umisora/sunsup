export type PhotoName = "table" | "place" | "office" | "detail" | "peak" | "peak-wide" | "scene-bonenkai";

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
};
