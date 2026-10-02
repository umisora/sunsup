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
  labelledBy?: string;
  label?: string;
  children: ReactNode;
};

export function Section({ width = "wrap", space = "lg", labelledBy, label, children }: SectionProps) {
  return (
    <section
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

type StackGap = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type StackProps = {
  gap?: StackGap;
  align?: "start" | "stretch";
  children: ReactNode;
};

export function Stack({ gap = 4, align = "start", children }: StackProps) {
  const style = { gap: `var(--space-${gap})` } satisfies CSSProperties;
  return (
    <div className={cx(styles.stack, align === "stretch" && styles.stackStretch)} style={style}>
      {children}
    </div>
  );
}