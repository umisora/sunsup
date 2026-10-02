import type { ReactNode } from "react";
import { StillLife } from "../StillLife/StillLife";
import { Numeral, Text } from "../Text/Text";
import styles from "./PeakStage.module.css";

type PeakStageProps = {
  id: string;
  folio: string;
  /** A priority wide <Photo> with a `narrow` portrait crop; the calm left side carries the headline. */
  media: ReactNode;
  children: ReactNode;
};

/**
 * The desire peak. On wide screens it pins and the photo opens from an inset card to full bleed;
 * on narrow screens the photo scrubs open and the headline sits below it.
 */
export function PeakStage({ id, folio, media, children }: PeakStageProps) {
  return (
    <section className={styles.stage} aria-labelledby={id} data-peak-stage>
      <div className={styles.frame} data-peak-frame>
        <StillLife ratio="fill" radius="none">
          {media}
        </StillLife>
      </div>
      <div className={styles.copy} data-peak-copy>
        <Numeral size="md">{folio}</Numeral>
        <div className={styles.line}>
          <Text as="h2" id={id} variant="statement">
            {children}
          </Text>
        </div>
      </div>
    </section>
  );
}
