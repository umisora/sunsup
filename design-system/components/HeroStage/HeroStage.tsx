import type { ReactNode } from "react";
import { StillLife } from "../StillLife/StillLife";
import styles from "./HeroStage.module.css";

type HeroStageProps = {
  labelledBy: string;
  /** A priority <Photo> for the stage. */
  media: ReactNode;
  /** Small content pinned to a corner of the photo (e.g. a ChipList). */
  aside?: ReactNode;
  /** The headline, usually <DisplayLines variant="tate">. Stands on the paper, upper right of the copy column. */
  title: ReactNode;
  /** Calls to action. Under the lead when wide; a full-width row under the title when narrow. */
  actions?: ReactNode;
  /** Lead, lower left of the copy column. */
  children: ReactNode;
};

/** Home hero: a vertical headline on the paper beside a large still life. */
export function HeroStage({ labelledBy, media, aside, title, actions, children }: HeroStageProps) {
  return (
    <section className={styles.hero} aria-labelledby={labelledBy}>
      <div className={styles.copy}>
        <div className={styles.title}>{title}</div>
        <div className={styles.side}>{children}</div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      <div className={styles.stage}>
        <StillLife ratio="fill" radius="none" intro parallax>
          {media}
        </StillLife>
        {aside ? <div className={styles.aside}>{aside}</div> : null}
      </div>
    </section>
  );
}
