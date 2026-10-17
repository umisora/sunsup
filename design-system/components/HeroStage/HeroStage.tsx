import type { ReactNode } from "react";
import { TABLE_CAST, type ArrivalStand, type ArrivalToast } from "../TableArrival/cast";
import { TableArrival, type TablePiece } from "../TableArrival/TableArrival";
import styles from "./HeroStage.module.css";

export type HeroFrame = {
  nw: number;
  nh: number;
  l: number;
  t: number;
  cw: number;
  ch: number;
};

export type HeroTableDrink = {
  slug: string;
  name: string;
  src: string;
  stand?: ArrivalStand;
  frame?: HeroFrame;
};

type HeroStageProps = {
  labelledBy: string;
  /** Two or three catalog stills, left to right. The first is already on the table. */
  drinks: readonly HeroTableDrink[];
  /** Remounts the arrival when the visit story changes. */
  castKey: string;
  /** Set on the section so a visit can be told apart. */
  visitId?: string;
  /** Slugs on the table, so a reload can be told apart. */
  drinkIds?: string;
  /** Small content pinned to a corner of the stage (e.g. a ChipList). */
  aside?: ReactNode;
  /** The headline, usually <DisplayLines variant="tate">. Stands on the paper, upper right of the copy column. */
  title: ReactNode;
  /** Calls to action. Under the lead when wide; a full-width row under the title when narrow. */
  actions?: ReactNode;
  /** Lead, lower left of the copy column. */
  children: ReactNode;
  /** A still failed to decode. */
  onStillError?: (slug: string) => void;
};

const ARRIVALS = [
  { fromX: "0%", fromY: "0%", fromR: 0 },
  { fromX: "92%", fromY: "36%", fromR: -4 },
  { fromX: "170%", fromY: "16%", fromR: 5 },
] as const;

function toastAt(index: 0 | 1 | 2): ArrivalToast | undefined {
  switch (index) {
    case 0:
      return "left";
    case 1:
      return "right";
    case 2:
      return undefined;
    default: {
      const exhaustive: never = index;
      return exhaustive;
    }
  }
}

function tablePieces(drinks: readonly HeroTableDrink[]): TablePiece[] {
  if (drinks.length < 2 || drinks.length > 3) {
    throw new Error("hero table needs two or three drinks");
  }
  return drinks.map((drink, index) => {
    const item = TABLE_CAST[drink.slug];
    const frame = item?.frame ?? drink.frame;
    const stand = item?.stand ?? drink.stand;
    const src = item?.src ?? drink.src;
    if (!frame || !stand) {
      throw new Error(`hero drink missing: ${drink.slug}`);
    }
    if (!src.startsWith("/drinks/") || src.includes("fallback-")) {
      throw new Error(`hero still invalid: ${drink.slug}`);
    }
    if (item && drink.src !== item.src) {
      throw new Error(`hero still changed for ${drink.slug}`);
    }
    const place = index === 0 || index === 1 || index === 2 ? index : undefined;
    if (place === undefined) {
      throw new Error("hero arrival missing");
    }
    const motion = ARRIVALS[place];
    return {
      slug: drink.slug,
      name: drink.name,
      src,
      stand,
      toast: toastAt(place),
      anchor: place === 0,
      nw: frame.nw,
      nh: frame.nh,
      l: frame.l,
      t: frame.t,
      cw: frame.cw,
      ch: frame.ch,
      fromX: motion.fromX,
      fromY: motion.fromY,
      fromR: motion.fromR,
    };
  });
}

/** Home hero: a vertical headline on the paper beside the table, where the drinks arrive. */
export function HeroStage({ labelledBy, drinks, castKey, visitId, drinkIds, aside, title, actions, children, onStillError }: HeroStageProps) {
  return (
    <section className={styles.hero} aria-labelledby={labelledBy} data-visit={visitId} data-drinks={drinkIds}>
      <div className={styles.copy}>
        <div className={styles.title}>{title}</div>
        <div className={styles.side}>{children}</div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      <div className={styles.stage}>
        <TableArrival key={castKey} pieces={tablePieces(drinks)} onStillError={onStillError} />
        {aside ? <div className={styles.aside}>{aside}</div> : null}
      </div>
    </section>
  );
}
