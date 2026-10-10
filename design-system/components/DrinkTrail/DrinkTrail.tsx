import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "../../cx";
import { ArrowGlyph } from "../DrinkShelf/DrinkShelf";
import { ExternalPhoto, StillLife } from "../StillLife/StillLife";
import styles from "./DrinkTrail.module.css";

type TrailDrink = { slug: string; name: string; stillUrl: string };

function Step({ drink, direction }: { drink: TrailDrink; direction: "previous" | "next" }) {
  return (
    <Link href={`/drink/${drink.slug}/`} className={cx(styles.step, direction === "next" && styles.next)}>
      {drink.stillUrl ? (
        <span className={styles.thumb}>
          <StillLife ratio="fill" radius="sm" fit="plinth">
            <ExternalPhoto src={drink.stillUrl} alt="" />
          </StillLife>
        </span>
      ) : null}
      <span className={styles.copy}>
        <span className={styles.dir}>
          <span className={styles.arrow} aria-hidden="true">
            <ArrowGlyph />
          </span>
          {direction === "next" ? "次の一杯" : "前の一杯"}
        </span>
        <span className={styles.name}>{drink.name}</span>
      </span>
    </Link>
  );
}

/** Walk the shelf one drink at a time, like turning a page. */
export function DrinkTrail({ previous, next, label }: { previous: TrailDrink; next: TrailDrink; label: string }) {
  return (
    <nav className={styles.trail} aria-label={label}>
      <Step drink={previous} direction="previous" />
      <Step drink={next} direction="next" />
    </nav>
  );
}

type VenueLinkProps = {
  href: string;
  media: ReactNode;
  eyebrow: string;
  title: ReactNode;
  body: ReactNode;
};

/** A compact card back to the venue the drink was chosen for. */
export function VenueLink({ href, media, eyebrow, title, body }: VenueLinkProps) {
  return (
    <Link href={href} className={styles.venue}>
      <span className={styles.venueMedia}>
        <StillLife ratio="fill" radius="none" hoverZoom>
          {media}
        </StillLife>
      </span>
      <span className={styles.venueCopy}>
        <span className={styles.venueEyebrow}>{eyebrow}</span>
        <span className={styles.venueTitle}>{title}</span>
        <span className={styles.venueBody}>{body}</span>
      </span>
      <span className={styles.venueGo} aria-hidden="true">
        <ArrowGlyph />
      </span>
    </Link>
  );
}
