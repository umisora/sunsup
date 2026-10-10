import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowGlyph } from "../DrinkShelf/DrinkShelf";
import styles from "./CategoryNav.module.css";

export type CategoryLink = {
  id: string;
  category: string;
  count: number;
};

function folio(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** Sticky jump bar over the drink list. One stop per category, with how many drinks it holds. */
export function CategoryNav({ categories, total }: { categories: readonly CategoryLink[]; total: number }) {
  return (
    <nav className={styles.bar} aria-label="カテゴリ">
      <div className={styles.inner}>
        <p className={styles.total}>
          <span className={styles.totalNo}>{total}</span>本
        </p>
        <ul className={styles.list}>
          {categories.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className={styles.link}>
                {item.category}
                <span className={styles.count}>{item.count}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

type ShelfHeadProps = {
  id: string;
  index: number;
  title: ReactNode;
  count: number;
};

/** Head of one category shelf: catalog numeral, name, and count. The section anchor sits here. */
export function ShelfHead({ id, index, title, count }: ShelfHeadProps) {
  return (
    <header className={styles.head}>
      <span className={styles.folio} aria-hidden="true">
        {folio(index)}
      </span>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      <p className={styles.meta}>{count}本</p>
    </header>
  );
}

/** Category index on the deep-green band. Each stop opens that shelf of the list. */
export function CategoryIndex({ categories }: { categories: readonly CategoryLink[] }) {
  return (
    <ol className={styles.index}>
      {categories.map((item, index) => (
        <li key={item.id}>
          <Link href={`/drink/#${item.id}`} className={styles.stop}>
            <span className={styles.stopNo} aria-hidden="true">
              {folio(index)}
            </span>
            <span className={styles.stopName}>{item.category}</span>
            <span className={styles.stopCount}>{item.count}本</span>
            <span className={styles.stopGo} aria-hidden="true">
              <ArrowGlyph />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
