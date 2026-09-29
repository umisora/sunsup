import type { ReactNode } from "react";
import { StillLife } from "../StillLife/StillLife";
import { Surface } from "../Surface/Surface";
import styles from "./HeroStage.module.css";

type HeroStageProps = {
  labelledBy: string;
  /** A priority <Photo> for the full-bleed stage. */
  media: ReactNode;
  /** Small content pinned to the opposite corner (e.g. a ChipList). */
  aside?: ReactNode;
  /** Headline card content. */
  children: ReactNode;
};

/** Home hero: a rounded full-bleed still life that slides under the header, with a frosted headline card. */
export function HeroStage({ labelledBy, media, aside, children }: HeroStageProps) {
  return (
    <section className={styles.hero} aria-labelledby={labelledBy}>
      <div className={styles.stage}>
        <StillLife ratio="fill" radius="none" intro parallax>
          {media}
        </StillLife>
      </div>
      <div className={styles.card} data-drift>
        <Surface tone="frost" padding="lg">
          {children}
        </Surface>
      </div>
      {aside ? <div className={styles.aside}>{aside}</div> : null}
    </section>
  );
}
