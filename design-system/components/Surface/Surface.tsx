import type { ReactNode } from "react";
import { cx } from "../../cx";
import styles from "./Surface.module.css";

export type SurfaceTone = "raised" | "frost" | "inverse";

const PAD = { md: styles.padMd, lg: styles.padLg, xl: styles.padXl } as const;
const RADIUS = { md: styles.radiusMd, lg: styles.radiusLg } as const;

type SurfaceProps = {
  tone: SurfaceTone;
  padding?: keyof typeof PAD;
  radius?: keyof typeof RADIUS;
  elevated?: boolean;
  fill?: boolean;
  as?: "div" | "li" | "section" | "article";
  labelledBy?: string;
  /** Motion: slides in on scroll but is never hidden (use for anything holding a journey CTA). */
  rise?: boolean;
  /** Motion: fades up on scroll. */
  reveal?: boolean;
  /** Motion: joins a batched card entrance. */
  staggerItem?: boolean;
  children: ReactNode;
};

export function Surface({
  tone,
  padding = "lg",
  radius = "md",
  elevated = false,
  fill = false,
  as: Tag = "div",
  labelledBy,
  rise = false,
  reveal = false,
  staggerItem = false,
  children,
}: SurfaceProps) {
  return (
    <Tag
      className={cx(styles.surface, styles[tone], PAD[padding], RADIUS[radius], elevated && styles.elevated, fill && styles.fill)}
      aria-labelledby={labelledBy}
      data-rise={rise || undefined}
      data-reveal={reveal || undefined}
      data-stagger-item={staggerItem || undefined}
    >
      {children}
    </Tag>
  );
}
