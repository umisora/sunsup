import type { ReactNode } from "react";
import { cx } from "../../cx";
import styles from "./Chip.module.css";

type ChipTone = "raised" | "frost";

type ChipProps = {
  tone?: ChipTone;
  folio?: boolean;
  intro?: boolean;
  children: ReactNode;
};

export function Chip({ tone = "raised", folio = false, intro = false, children }: ChipProps) {
  return (
    <span className={cx(styles.chip, styles[tone], folio && styles.folio)} data-intro={intro || undefined}>
      {children}
    </span>
  );
}

type ChipListProps = {
  tone?: ChipTone;
  label: string;
  items: readonly string[];
  intro?: boolean;
};

export function ChipList({ tone = "raised", label, items, intro = false }: ChipListProps) {
  return (
    <ul className={styles.list} aria-label={label} data-intro={intro || undefined}>
      {items.map((item) => (
        <li key={item} className={cx(styles.chip, styles[tone])}>
          {item}
        </li>
      ))}
    </ul>
  );
}
