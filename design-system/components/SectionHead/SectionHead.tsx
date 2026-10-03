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
  children?: ReactNode;
};

export function SectionHead({ id, eyebrow, title, size = "headline", compact = false, children }: SectionHeadProps) {
  return (
    <header className={cx(styles.head, compact && styles.compact)} data-reveal>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text as="h2" id={id} variant={size}>
        {title}
      </Text>
      {children}
    </header>
  );
}
