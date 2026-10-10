import type { CSSProperties, ReactNode } from "react";
import { cx } from "../../cx";
import styles from "./Layout.module.css";

type SectionWidth = "wrap" | "bleed" | "full";
type SectionSpace = "none" | "sm" | "md" | "lg";

const SPACE: Record<SectionSpace, string> = {
  none: styles.spaceNone,
  sm: styles.spaceSm,
  md: styles.spaceMd,
  lg: styles.spaceLg,
};

const WIDTH: Record<SectionWidth, string> = {
  wrap: styles.wrap,
  bleed: styles.bleed,
  full: "",
};

type SectionProps = {
  width?: SectionWidth;
  space?: SectionSpace;
  /** In-page anchor, e.g. a category shelf on the list. */
  id?: string;
  labelledBy?: string;
  label?: string;
  /** Deep-green full-width band; content stays in the wrap. */
  band?: boolean;
  children: ReactNode;
};

export function Section({ width = "wrap", space = "lg", id, labelledBy, label, band = false, children }: SectionProps) {
  if (band) {
    return (
      <section id={id} className={cx(styles.section, styles.band, SPACE[space])} aria-labelledby={labelledBy} aria-label={label}>
        <div className={cx(styles.bandInner, WIDTH[width])}>{children}</div>
      </section>
    );
  }
  return (
    <section
      id={id}
      className={cx(styles.section, WIDTH[width], SPACE[space])}
      aria-labelledby={labelledBy}
      aria-label={label}
    >
      {children}
    </section>
  );
}

export function Container({ children }: { children: ReactNode }) {
  return <div className={styles.wrap}>{children}</div>;
}

type GridColumns = "split" | "splitWide" | "aside" | "halves" | "thirds" | "quarters";
type GridAlign = "start" | "center" | "end" | "stretch";

const ALIGN: Record<GridAlign, string> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
  stretch: styles.alignStretch,
};

type GridProps = {
  columns: GridColumns;
  align?: GridAlign;
  gap?: "grid" | "wide";
  offset?: boolean;
  as?: "div" | "ol" | "ul";
  label?: string;
  children: ReactNode;
};

export function Grid({ columns, align = "stretch", gap = "grid", offset = false, as: Tag = "div", label, children }: GridProps) {
  return (
    <Tag
      className={cx(styles.grid, styles[columns], ALIGN[align], gap === "wide" && styles.gapWide, offset && styles.offset)}
      aria-label={label}
    >
      {children}
    </Tag>
  );
}

type StackGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type StackProps = {
  gap?: StackGap;
  align?: "start" | "stretch";
  children: ReactNode;
};

export function Stack({ gap = 4, align = "start", children }: StackProps) {
  const style = { gap: gap === 0 ? 0 : `var(--space-${gap})` } satisfies CSSProperties;
  return (
    <div className={cx(styles.stack, align === "stretch" && styles.stackStretch)} style={style}>
      {children}
    </div>
  );
}