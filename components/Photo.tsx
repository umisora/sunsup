type PhotoName = "table" | "place" | "office" | "detail" | "peak";

type PhotoSpec = {
  widths: readonly number[];
  width: number;
  height: number;
  alt: string;
};

const PHOTOS: Record<PhotoName, PhotoSpec> = {
  table: {
    widths: [768, 1280],
    width: 1280,
    height: 720,
    alt: "窓のあるオフィスの長い卓。リネンの上に、緑のガラス瓶と短い缶、グレープフルーツを添えた炭酸のグラス。",
  },
  place: {
    widths: [720, 1152],
    width: 1152,
    height: 864,
    alt: "会議テーブルがそのまま卓になった、窓の明るいオフィス。緑のガラス瓶が並ぶ。",
  },
  office: {
    widths: [768, 1280],
    width: 1280,
    height: 720,
    alt: "デスクが卓になる午後。緑のガラス瓶と、炭酸のグラスが二つ。",
  },
  detail: {
    widths: [720, 1152],
    width: 1152,
    height: 864,
    alt: "リネンの上の炭酸のグラス、半分のグレープフルーツ、ぶどう、真鍮の栓抜き。",
  },
  peak: {
    widths: [560, 864],
    width: 864,
    height: 1152,
    alt: "窓の光が落ちるリネンの上、緑のガラス瓶と、グレープフルーツを添えた炭酸のグラス。",
  },
};

type PhotoProps = {
  name: PhotoName;
  sizes: string;
  priority?: boolean;
};

export function Photo({ name, sizes, priority = false }: PhotoProps) {
  const spec = PHOTOS[name];
  const largest = spec.widths[spec.widths.length - 1];

  return (
    <img
      src={`/images/${name}-${largest}.webp`}
      srcSet={spec.widths.map((w) => `/images/${name}-${w}.webp ${w}w`).join(", ")}
      sizes={sizes}
      width={spec.width}
      height={spec.height}
      alt={spec.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
    />
  );
}
