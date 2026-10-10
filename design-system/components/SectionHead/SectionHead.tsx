import type { ReactNode } from "react";
import { cx } from "../../cx";
import { Eyebrow, Text } from "../Text/Text";
import styles from "./SectionHead.module.css";

type SectionHeadProps = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  size?: "headline" | "statement";
  /** Less space under the heading, for a dense list that follows. */
  compact?: boolean;
  /** One large character set beside the heading, e.g. the season. Decorative. */
  glyph?: string;
  children?: ReactNode;
};

export function SectionHead({ id, eyebrow, title, size = "headline", compact = false, glyph, children }: SectionHeadProps) {
  const head = (
    <>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text as="h2" id={id} variant={size}>
        {title}
      </Text>
      {children}
    </>
  );

  if (glyph) {
    return (
      <header className={cx(styles.head, styles.withGlyph)} data-reveal>
        <span className={styles.glyph} aria-hidden="true">
          {glyph}
        </span>
        <div className={styles.glyphCopy}>{head}</div>
      </header>
    );
  }

  return (
    <header className={cx(styles.head, compact && styles.compact)} data-reveal>
      {head}
    </header>
  );
}
