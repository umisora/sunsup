import type { ReactNode } from "react";
import { cx } from "../../cx";
import { StillLife } from "../StillLife/StillLife";
import { Surface } from "../Surface/Surface";
import styles from "./MediaPanel.module.css";

type MediaPanelProps = {
  media: ReactNode;
  cardSide?: "start" | "end";
  children: ReactNode;
};

/** Full-bleed still life with a frosted card over the calm side of the photo. Place in a <Section width="full">. */
export function MediaPanel({ media, cardSide = "end", children }: MediaPanelProps) {
  return (
    <div className={cx(styles.panel, cardSide === "start" && styles.start)}>
      <StillLife ratio="fill" radius="none" parallax>
        {media}
      </StillLife>
      <div className={styles.card}>
        <Surface tone="frost" padding="lg" rise>
          {children}
        </Surface>
      </div>
    </div>
  );
}
