import type { ReactNode } from "react";
import { TABLE_CAST, type ArrivalToast } from "../TableArrival/cast";
import { TableArrival, type TablePiece } from "../TableArrival/TableArrival";
import styles from "./HeroStage.module.css";

export type HeroTableDrink = {
  slug: string;
  name: string;
  src: string;
};

type HeroStageProps = {
  labelledBy: string;
  /** Two or three catalog stills, left to right. The first is already on the table. */
  drinks: readonly HeroTableDrink[];
  /** Remounts the arrival when the visit story changes. */
  castKey: string;
  /** Set on the section so a visit can be told apart. */
  visitId?: string;
  /** Small content pinned to a corner of the stage (e.g. a ChipList). */
  aside?: ReactNode;
  /** The headline, usually <DisplayLines variant="tate">. Stands on the paper, upper right of the copy column. */
  title: ReactNode;
  /** Calls to action. Under the lead when wide; a full-width row under the title when narrow. */
  actions?: ReactNode;
  /** Lead, lower left of the copy column. */
  children: ReactNode;
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
    if (!item) {
      throw new Error(`hero drink missing: ${drink.slug}`);
    }
    if (drink.src !== item.src) {
      throw new Error(`hero still changed for ${drink.slug}`);
    }
    const place = index === 0 || index === 1 || index === 2 ? index : undefined;
    if (place === undefined) {
      throw new Error("hero arrival missing");
    }
    const motion = ARRIVALS[place];
    return {
      slug: item.slug,
      name: drink.name,
      src: item.src,
      stand: item.stand,
      toast: toastAt(place),
      anchor: place === 0,
      nw: item.frame.nw,
      nh: item.frame.nh,
      l: item.frame.l,
      t: item.frame.t,
      cw: item.frame.cw,
      ch: item.frame.ch,
      fromX: motion.fromX,
      fromY: motion.fromY,
      fromR: motion.fromR,
    };
  });
}

/** Home hero: a vertical headline on the paper beside the table, where the drinks arrive. */
export function HeroStage({ labelledBy, drinks, castKey, visitId, aside, title, actions, children }: HeroStageProps) {
  return (
    <section className={styles.hero} aria-labelledby={labelledBy} data-visit={visitId}>
      <div className={styles.copy}>
        <div className={styles.title}>{title}</div>
        <div className={styles.side}>{children}</div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      <div className={styles.stage}>
        <TableArrival key={castKey} pieces={tablePieces(drinks)} />
        {aside ? <div className={styles.aside}>{aside}</div> : null}
      </div>
    </section>
  );
}
