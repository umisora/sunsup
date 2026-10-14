import type { ReactNode } from "react";
import { TABLE_CAST } from "../TableArrival/cast";
import { TableArrival, type TablePiece } from "../TableArrival/TableArrival";
import styles from "./HeroStage.module.css";

export type HeroTableDrink = {
  slug: string;
  name: string;
  src: string;
};

type HeroStageProps = {
  labelledBy: string;
  /** Catalog rows for the table cast, in any order. Names and stills come from the drink data. */
  drinks: readonly HeroTableDrink[];
  /** Small content pinned to a corner of the stage (e.g. a ChipList). */
  aside?: ReactNode;
  /** The headline, usually <DisplayLines variant="tate">. Stands on the paper, upper right of the copy column. */
  title: ReactNode;
  /** Calls to action. Under the lead when wide; a full-width row under the title when narrow. */
  actions?: ReactNode;
  /** Lead, lower left of the copy column. */
  children: ReactNode;
};

function tablePieces(drinks: readonly HeroTableDrink[]): TablePiece[] {
  return TABLE_CAST.map((item) => {
    const drink = drinks.find((candidate) => candidate.slug === item.slug);
    if (!drink) {
      throw new Error(`hero drink missing: ${item.slug}`);
    }
    if (drink.src !== item.src) {
      throw new Error(`hero still changed for ${item.slug}`);
    }
    return {
      slug: item.slug,
      name: drink.name,
      src: item.src,
      stand: item.stand,
      toast: item.toast,
      anchor: item.anchor,
      nw: item.frame.nw,
      nh: item.frame.nh,
      l: item.frame.l,
      t: item.frame.t,
      cw: item.frame.cw,
      ch: item.frame.ch,
      fromX: item.fromX,
      fromY: item.fromY,
      fromR: item.fromR,
    };
  });
}

/** Home hero: a vertical headline on the paper beside the table, where the drinks arrive. */
export function HeroStage({ labelledBy, drinks, aside, title, actions, children }: HeroStageProps) {
  return (
    <section className={styles.hero} aria-labelledby={labelledBy}>
      <div className={styles.copy}>
        <div className={styles.title}>{title}</div>
        <div className={styles.side}>{children}</div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      <div className={styles.stage}>
        <TableArrival pieces={tablePieces(drinks)} />
        {aside ? <div className={styles.aside}>{aside}</div> : null}
      </div>
    </section>
  );
}
