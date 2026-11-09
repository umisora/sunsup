import type { ReactNode } from "react";
import { cx } from "../../cx";
import { StillLife } from "../StillLife/StillLife";
import { Numeral, Text } from "../Text/Text";
import textStyles from "../Text/Text.module.css";
import styles from "./Tile.module.css";

type TileProps = {
  no: string;
  title: string;
  titleAs?: "h2" | "h3" | "p";
  /**
   * Id of the title. The title is then a paragraph that names the tile body
   * (`role="group"`), so a short label stays out of the page outline.
   */
  titleId?: string;
  /** A decorative <Photo> crop. With media the tile becomes a photo card with the numeral over the image. */
  media?: ReactNode;
  lines: readonly string[];
};

/** Bento unit. Always joins the batched card entrance, so place it in a <Grid as="ol">. */
export function Tile({ no, title, titleAs = "h3", titleId, media, lines }: TileProps) {
  const copy = (
    <>
      {titleId ? (
        <p id={titleId} className={cx(textStyles.title, styles.groupTitle)}>
          {title}
        </p>
      ) : (
        <Text as={titleAs} variant="title">
          {title}
        </Text>
      )}
      <div className={styles.lines}>
        {lines.map((line) => (
          <Text key={line} variant="small">
            {line}
          </Text>
        ))}
      </div>
    </>
  );
  const body = (
    <div className={styles.body} role={titleId ? "group" : undefined} aria-labelledby={titleId}>
      {copy}
    </div>
  );

  if (media) {
    return (
      <li className={styles.tile} data-stagger-item>
        <div className={styles.media}>
          <StillLife ratio="4:5" radius="none" overlay={<Numeral tone="inverse">{no}</Numeral>}>
            {media}
          </StillLife>
        </div>
        {body}
      </li>
    );
  }

  return (
    <li className={cx(styles.tile, styles.text)} data-stagger-item>
      <span className={styles.numeral}>
        <Numeral>{no}</Numeral>
      </span>
      {body}
    </li>
  );
}
