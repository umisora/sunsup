"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cx } from "../../cx";
import { ExternalPhoto, StillLife } from "../StillLife/StillLife";
import styles from "./MyTable.module.css";

export type TableDrink = {
  slug: string;
  name: string;
  stillUrl: string;
  category: string;
};

const SAVED = "sunsup:table";
const RECENT = "sunsup:recent";
const RECENT_KEPT = 12;
const CHANGE = "sunsup:table-change";

function read(key: string): TableDrink[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is TableDrink => typeof item?.slug === "string") : [];
  } catch {
    return [];
  }
}

function write(key: string, drinks: TableDrink[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(drinks));
    window.dispatchEvent(new Event(CHANGE));
  } catch {
    // storage full or blocked: the table simply stays as it was
  }
}

function useStored(key: string): TableDrink[] {
  const [drinks, setDrinks] = useState<TableDrink[]>([]);
  useEffect(() => {
    const sync = () => setDrinks(read(key));
    sync();
    window.addEventListener(CHANGE, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE, sync);
      window.removeEventListener("storage", sync);
    };
  }, [key]);
  return drinks;
}

/** Put this drink on わたしの卓, kept in this browser only. Also notes the visit for 最近見た一杯. */
export function TableToggle({ drink }: { drink: TableDrink }) {
  const saved = useStored(SAVED);
  const on = saved.some((item) => item.slug === drink.slug);

  useEffect(() => {
    const recent = read(RECENT).filter((item) => item.slug !== drink.slug);
    write(RECENT, [drink, ...recent].slice(0, RECENT_KEPT));
  }, [drink]);

  const toggle = useCallback(() => {
    const current = read(SAVED);
    const next = current.some((item) => item.slug === drink.slug)
      ? current.filter((item) => item.slug !== drink.slug)
      : [drink, ...current];
    write(SAVED, next);
  }, [drink]);

  return (
    <button type="button" className={cx(styles.toggle, on && styles.on)} aria-pressed={on} onClick={toggle}>
      <span className={styles.toggleMark} aria-hidden="true">
        <svg viewBox="0 0 12 12">
          {on ? (
            <path d="M1.5 6.5 4.5 9.5 10.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          ) : (
            <path d="M6 1v10M1 6h10" fill="none" stroke="currentColor" strokeWidth="1.4" />
          )}
        </svg>
      </span>
      {on ? "わたしの卓にある" : "わたしの卓に置く"}
    </button>
  );
}

function Strip({ title, drinks, note }: { title: string; drinks: readonly TableDrink[]; note?: string }) {
  return (
    <section className={styles.strip} aria-label={title}>
      <header className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.count}>{drinks.length}</span>
        {note ? <p className={styles.note}>{note}</p> : null}
      </header>
      <ul className={styles.row}>
        {drinks.map((drink) => (
          <li key={drink.slug} className={styles.item}>
            <Link href={`/drink/${drink.slug}/`} className={styles.card}>
              {drink.stillUrl ? (
                <span className={styles.thumb}>
                  <StillLife ratio="fill" radius="sm" fit="plinth">
                    <ExternalPhoto src={drink.stillUrl} alt="" />
                  </StillLife>
                </span>
              ) : null}
              <span className={styles.category}>{drink.category}</span>
              <span className={styles.name}>{drink.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** わたしの卓 and 最近見た一杯, from this browser. Renders nothing for a first visit. */
export function TableShelf({ exclude, known }: { exclude?: string; known?: readonly string[] }) {
  const allowed = known ? new Set(known) : null;
  const visible = (item: TableDrink) => !allowed || allowed.has(item.slug);
  const saved = useStored(SAVED).filter(visible);
  const recent = useStored(RECENT).filter((item) => item.slug !== exclude && visible(item));
  if (saved.length === 0 && recent.length === 0) {
    return null;
  }
  return (
    <div className={styles.shelf}>
      {saved.length > 0 ? <Strip title="わたしの卓" drinks={saved} note="次の飲み会の候補。このブラウザにだけ残る。" /> : null}
      {recent.length > 0 ? <Strip title="最近見た一杯" drinks={recent} /> : null}
    </div>
  );
}
