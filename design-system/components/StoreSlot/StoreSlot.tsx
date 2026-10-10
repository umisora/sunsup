import { Button } from "../Button/Button";
import styles from "./StoreSlot.module.css";

const PLACEHOLDER = [
  { role: "acquire", label: "購入先" },
  { role: "nearby", label: "取扱店" },
  { role: "read", label: "詳細" },
] as const;

export type StoreLink = {
  label: string;
  href: string;
  text: string;
};

type StoreSlotProps = {
  /** Plain store links, in display order. Empty or omitted keeps the shell placeholder hidden. */
  rows?: readonly StoreLink[];
};

export function storeAction(row: StoreLink): string {
  return `${row.text}で見る`;
}

/**
 * Where to get the drink.
 * Product pages pass 公式, Amazon, 楽天 — only real product URLs, in that order.
 * The first row is the one primary action. The shell passes nothing.
 */
export function StoreSlot({ rows }: StoreSlotProps = {}) {
  if (rows && rows.length > 0) {
    const [primary, ...rest] = rows;
    if (!primary) {
      return null;
    }
    return (
      <section id="store-row" className={styles.slot} aria-label="買う">
        <p className={styles.label}>購入先</p>
        <Button variant="primary" size="lg" icon="external" stretch href={primary.href} storePrimary>
          {storeAction(primary)}
        </Button>
        {rest.length > 0 ? (
          <ul className={styles.more}>
            {rest.map((row) => (
              <li key={row.label}>
                <Button variant="secondary" icon="external" stretch href={row.href}>
                  {storeAction(row)}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    );
  }

  if (rows) {
    return null;
  }

  return (
    <section id="store-row" className={styles.slot} hidden aria-label="買う">
      <dl className={styles.list}>
        {PLACEHOLDER.map((row) => (
          <div key={row.role} className={styles.row} data-role={row.role}>
            <dt className={styles.label}>{row.label}</dt>
            <dd />
          </div>
        ))}
      </dl>
    </section>
  );
}
