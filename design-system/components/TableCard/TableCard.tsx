import type { ReactNode } from "react";
import { Phrase } from "../Text/Text";
import styles from "./TableCard.module.css";

type TableCardProps = {
  id: string;
  /** Collection number, e.g. "No. 012 / 577". */
  folio: string;
  category: string;
  name: string;
  /** The drink's own still in a plinth <StillLife>. Without one the card is type only. */
  media?: ReactNode;
  actions?: ReactNode;
  share?: ReactNode;
};

/** The close of a drink page, set as one card: made to be screenshotted and sent on. Covers the store dock while on screen. */
export function TableCard({ id, folio, category, name, media, actions, share }: TableCardProps) {
  return (
    <article className={styles.card} aria-labelledby={id} data-dock-cover data-rise>
      {media ? <div className={styles.media}>{media}</div> : null}
      <div className={styles.body}>
        <p className={styles.brand}>
          <span className={styles.mark}>sunsup</span>
          <span className={styles.folio}>{folio}</span>
        </p>
        <div className={styles.copy}>
          <p className={styles.category}>{category}</p>
          <p className={styles.name}>{name}</p>
          <h2 id={id} className={styles.close}>
            <Phrase>次の飲み会に、</Phrase>
            <Phrase>これを置く。</Phrase>
          </h2>
        </div>
        {actions || share ? (
          <div className={styles.foot}>
            {actions}
            {share}
          </div>
        ) : null}
      </div>
    </article>
  );
}
