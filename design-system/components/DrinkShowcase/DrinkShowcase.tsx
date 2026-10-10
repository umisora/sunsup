import Link from "next/link";
import { cx } from "../../cx";
import { ExternalPhoto, StillLife } from "../StillLife/StillLife";
import styles from "./DrinkShowcase.module.css";

export type DrinkShowcaseItem = {
  slug: string;
  name: string;
  size: string;
  stillUrl: string;
  /** Small label over the name, e.g. the category. */
  label?: string;
};

type DrinkShowcaseProps = {
  drinks: readonly DrinkShowcaseItem[];
  /** Columns once wide. Narrow screens always run two. */
  columns?: 3 | 4;
  label?: string;
};

/** A short, curated run of drinks: still on its plinth, name beneath. Without a still the card is text only. */
export function DrinkShowcase({ drinks, columns = 3, label }: DrinkShowcaseProps) {
  return (
    <ul className={cx(styles.grid, columns === 4 && styles.four)} aria-label={label}>
      {drinks.map((drink) => (
        <li key={drink.slug} className={styles.item} data-stagger-item>
          <Link href={`/drink/${drink.slug}/`} className={styles.card}>
            {drink.stillUrl ? (
              <StillLife ratio="4:5" radius="md" fit="plinth">
                <ExternalPhoto src={drink.stillUrl} alt="" />
              </StillLife>
            ) : null}
            <span className={cx(styles.copy, !drink.stillUrl && styles.plain)}>
              {drink.label ? <span className={styles.label}>{drink.label}</span> : null}
              <span className={styles.name}>{drink.name}</span>
              <span className={styles.size}>{drink.size}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
