import Link from "next/link";
import { cx } from "../../cx";
import { ExternalPhoto, StillLife } from "../StillLife/StillLife";
import styles from "./DrinkShelf.module.css";

export type DrinkShelfItem = {
  slug: string;
  name: string;
  size: string;
  stillUrl: string;
};

type DrinkShelfProps = {
  drinks: readonly DrinkShelfItem[];
  /** The first shelf on the page. Its opening stills load with the first screen. */
  opening?: boolean;
  /** Skip layout until this shelf nears the viewport. Keep the opening shelf off. */
  defer?: boolean;
};

const EAGER_STILLS = 6;

/**
 * Drinks on the table: a still beside its name, in columns once the shelf is wide.
 * A drink with no still is a line only — no frame, no stand-in photograph.
 */
export function DrinkShelf({ drinks, opening = false, defer = false }: DrinkShelfProps) {
  const pictured = drinks.filter((drink) => drink.stillUrl !== "");
  const plain = drinks.filter((drink) => drink.stillUrl === "");

  return (
    <div className={defer ? styles.defer : undefined}>
      <div className={styles.block}>
        {pictured.length > 0 ? (
          <ul className={styles.shelf}>
            {pictured.map((drink, index) => (
              <li key={drink.slug}>
                <Link href={`/drink/${drink.slug}/`} className={styles.entry}>
                  <span className={styles.well}>
                    <StillLife ratio="fill" radius="sm" fit="contain">
                      <ExternalPhoto
                        src={drink.stillUrl}
                        alt=""
                        priority={opening && index === 0}
                        lazy={!(opening && index < EAGER_STILLS)}
                      />
                    </StillLife>
                  </span>
                  <span className={styles.copy}>
                    <span className={styles.name}>{drink.name}</span>
                    <span className={styles.size}>{drink.size}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {plain.length > 0 ? (
          <ul className={cx(styles.ledger, pictured.length === 0 && styles.ledgerOnly)}>
            {plain.map((drink) => (
              <li key={drink.slug}>
                <Link href={`/drink/${drink.slug}/`} className={styles.plain}>
                  <span className={styles.name}>{drink.name}</span>
                  <span className={styles.size}>{drink.size}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
