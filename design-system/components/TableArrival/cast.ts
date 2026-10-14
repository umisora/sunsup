export type ArrivalStand = "full" | "can";

export type ArrivalToast = "left" | "right";

export type TableCast = {
  slug: string;
  src: string;
  stand: ArrivalStand;
  toast?: ArrivalToast;
  /** Already on the table at first paint, so it can be the LCP image. */
  anchor?: boolean;
  /** Intrinsic size and the non-white content box of public/drinks/{slug}.webp. */
  frame: {
    nw: number;
    nh: number;
    l: number;
    t: number;
    cw: number;
    ch: number;
  };
  fromX: string;
  fromY: string;
  fromR: number;
};

/**
 * Office-table cast. Crop boxes are measured from the stills already in public/drinks.
 * Order is left to right on the table.
 */
export const TABLE_CAST: readonly TableCast[] = [
  {
    slug: "fujiya-nectar-peach",
    src: "/drinks/fujiya-nectar-peach.webp",
    stand: "can",
    frame: { nw: 350, nh: 350, l: 92, t: 25, cw: 164, ch: 310 },
    fromX: "-155%",
    fromY: "22%",
    fromR: -6,
  },
  {
    slug: "kimino-yuzu",
    src: "/drinks/kimino-yuzu.webp",
    stand: "full",
    toast: "left",
    anchor: true,
    frame: { nw: 1000, nh: 1000, l: 351, t: 103, cw: 405, ch: 834 },
    fromX: "0%",
    fromY: "0%",
    fromR: 0,
  },
  {
    slug: "sanpellegrino-aranciata",
    src: "/drinks/sanpellegrino-aranciata.webp",
    stand: "full",
    toast: "right",
    frame: { nw: 380, nh: 1000, l: 0, t: 1, cw: 380, ch: 998 },
    fromX: "78%",
    fromY: "46%",
    fromR: -3,
  },
  {
    slug: "suntory-oolong-340",
    src: "/drinks/suntory-oolong-340.webp",
    stand: "can",
    frame: { nw: 528, nh: 1000, l: 0, t: 0, cw: 528, ch: 1000 },
    fromX: "175%",
    fromY: "16%",
    fromR: 5,
  },
];

export const HERO_TABLE_SLUGS: readonly string[] = TABLE_CAST.map((item) => item.slug);
