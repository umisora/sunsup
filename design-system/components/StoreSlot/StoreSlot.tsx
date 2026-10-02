import styles from "./StoreSlot.module.css";

const ROWS = [
  { role: "acquire", label: "手に入れる" },
  { role: "nearby", label: "近く" },
  { role: "read", label: "読む" },
] as const;

/**
 * Where to get the drink, once there is something honest to put here.
 * Stays hidden and empty: no store names, no affiliate IDs.
 */
export function StoreSlot() {
  return (
    <section id="store-row" className={styles.slot} hidden aria-label="手に入れる">
      <dl className={styles.list}>
        {ROWS.map((row) => (
          <div key={row.role} className={styles.row} data-role={row.role}>
            <dt className={styles.label}>{row.label}</dt>
            <dd />
          </div>
        ))}
      </dl>
    </section>
  );
}
