import Link from "next/link";
import { cx } from "../../cx";
import { ExternalPhoto, StillLife } from "../StillLife/StillLife";
import { SoftBreak } from "../Text/Text";
import styles from "./DrinkShowcase.module.css";

/** Rendered card width: a swipe row on phones, a grid column once wide. */
const SHOWCASE_SIZES = "(max-width: 767px) 74vw, (max-width: 959px) 40vw, 220px";

/** /drinks/season/<file>.webp → its 480w / 800w / 1200w srcset (scripts/build-drink-thumbs.py). */
function seasonSrcSet(src: string): string | undefined {
  const match = /^\/drinks\/season\/([a-z0-9-]+_(?:spring|summer|autumn|winter)\.webp)$/.exec(src);
  return match
    ? `/drinks/season/480/${match[1]} 480w, /drinks/season/800/${match[1]} 800w, ${src} 1200w`
    : undefined;
}

export type DrinkShowcaseItem = {
  slug: string;
  name: string;
  size: string;
  stillUrl: string;
  /** An opaque seasonal studio still. When set it fills the card instead of the cutout on its plinth. */
  seasonUrl?: string;
  /** Small label over the name, e.g. the category. */
  label?: string;
};

type DrinkShowcaseProps = {
  drinks: readonly DrinkShowcaseItem[];
  /** Columns once wide. Narrow screens always run two. */
  columns?: 3 | 4;
  label?: string;
  /**
   * Cards fade in on scroll. Turn off for lists that mount after the page's motion is set up
   * (the top-page stories): GSAP never sees those, so they would stay hidden on wide screens.
   */
  stagger?: boolean;
};

/** A short, curated run of drinks: still on its plinth, name beneath. Without a still the card is text only. */
export function DrinkShowcase({ drinks, columns = 3, label, stagger = true }: DrinkShowcaseProps) {
  return (
    <ul className={cx(styles.grid, columns === 4 && styles.four)} aria-label={label}>
      {drinks.map((drink) => (
        <li key={drink.slug} className={styles.item} data-stagger-item={stagger || undefined}>
          <Link href={`/drink/${drink.slug}/`} className={styles.card}>
            {drink.seasonUrl ? (
              <StillLife ratio="4:5" radius="md" fit="cover" hoverZoom>
                <img
                  src={drink.seasonUrl}
                  srcSet={seasonSrcSet(drink.seasonUrl)}
                  sizes={SHOWCASE_SIZES}
                  alt=""
                  width={1200}
                  height={1200}
                  loading="lazy"
                  decoding="async"
                  data-season-still={drink.slug}
                />
              </StillLife>
            ) : drink.stillUrl ? (
              <StillLife ratio="4:5" radius="md" fit="plinth">
                <ExternalPhoto src={drink.stillUrl} alt="" sizes={SHOWCASE_SIZES} />
              </StillLife>
            ) : null}
            <span className={cx(styles.copy, !drink.stillUrl && !drink.seasonUrl && styles.plain)}>
              {drink.label ? <span className={styles.label}>{drink.label}</span> : null}
              <span className={styles.name}>
                <SoftBreak text={drink.name} />
              </span>
              <span className={styles.size}>{drink.size}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
