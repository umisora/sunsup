import type { ReactNode } from "react";
import { cx } from "../../cx";
import { PHOTOS, type PhotoName } from "./photos";
import styles from "./StillLife.module.css";

function srcSet(name: PhotoName): string {
  return PHOTOS[name].widths.map((w) => `/images/${name}-${w}.webp ${w}w`).join(", ");
}

type PhotoProps = {
  name: PhotoName;
  sizes: string;
  /** The LCP image of the page. Only one per page. */
  priority?: boolean;
  /** Repeated crops that add no information get an empty alt. */
  decorative?: boolean;
  position?: string;
  /** Art-directed crop for viewports under 700px. */
  narrow?: PhotoName;
};

export function Photo({ name, sizes, priority = false, decorative = false, position, narrow }: PhotoProps) {
  const spec = PHOTOS[name];
  const largest = spec.widths[spec.widths.length - 1];

  const image = (
    <img
      src={`/images/${name}-${largest}.webp`}
      srcSet={srcSet(name)}
      sizes={sizes}
      width={spec.width}
      height={spec.height}
      alt={decorative ? "" : spec.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      style={position ? { objectPosition: position } : undefined}
    />
  );

  if (!narrow) {
    return image;
  }

  return (
    <picture>
      <source media="(max-width: 699px)" srcSet={srcSet(narrow)} sizes="100vw" />
      {image}
    </picture>
  );
}

type ExternalPhotoProps = {
  src: string;
  alt: string;
  /** The LCP image of the page. Only one per page. */
  priority?: boolean;
};

/** A still life that is not in the local photo catalog. Use for a drink's 静物URL. */
export function ExternalPhoto({ src, alt, priority = false }: ExternalPhotoProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}

type Ratio = "16:9" | "4:3" | "4:5" | "3:4" | "fill";

const RATIO: Record<Ratio, string> = {
  "16:9": styles.r16x9,
  "4:3": styles.r4x3,
  "4:5": styles.r4x5,
  "3:4": styles.r3x4,
  fill: styles.fill,
};

type StillLifeProps = {
  ratio?: Ratio;
  radius?: "none" | "md" | "lg";
  /** Motion: image drifts against scroll. */
  parallax?: boolean;
  /** Motion: frame wipes open on page load. Use once per page, on the first frame. */
  intro?: boolean;
  /** Zoom slightly when an enclosing link is hovered. */
  hoverZoom?: boolean;
  overlay?: ReactNode;
  children: ReactNode;
};

/** Frame for a photographic still life. Children is a <Photo> or <ExternalPhoto>. */
export function StillLife({ ratio = "4:3", radius = "md", parallax = false, intro = false, hoverZoom = false, overlay, children }: StillLifeProps) {
  return (
    <div
      className={cx(
        styles.frame,
        RATIO[ratio],
        radius === "md" && styles.radiusMd,
        radius === "lg" && styles.radiusLg,
        parallax && styles.parallax,
        hoverZoom && styles.hoverZoom,
      )}
      data-intro-media={intro || undefined}
      data-parallax={parallax || undefined}
    >
      {children}
      {overlay ? <div className={styles.overlay}>{overlay}</div> : null}
    </div>
  );
}
