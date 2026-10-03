import { Button } from "../Button/Button";
import { TextLink } from "../Text/Text";
import styles from "./StoreSlot.module.css";

const PLACEHOLDER = [
  { role: "acquire", label: "手に入れる" },
  { role: "nearby", label: "近く" },
  { role: "read", label: "読む" },
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
      <section id="store-row" className={styles.slot} aria-label="店">
        <div className={styles.primary}>
          <Button variant="primary" href={primary.href} storePrimary>
            {primary.text}
          </Button>
        </div>
        {rest.length > 0 ? (
          <dl className={styles.list}>
            {rest.map((row) => (
              <div key={row.label} className={styles.row}>
                <dt className={styles.label}>{row.label}</dt>
                <dd>
                  <TextLink href={row.href} external>
                    {row.text}
                  </TextLink>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </section>
    );
  }

  if (rows) {
    return null;
  }

  return (
    <section id="store-row" className={styles.slot} hidden aria-label="手に入れる">
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
