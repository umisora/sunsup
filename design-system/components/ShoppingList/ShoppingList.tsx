"use client";

import { useMemo, useState } from "react";
import {
  clampHeadcount,
  DEFAULT_HEADCOUNT,
  LIST_SOURCE,
  lineShareUrl,
  listLines,
  listText,
  listTotal,
  MAX_HEADCOUNT,
  MIN_HEADCOUNT,
  type ListItem,
} from "@/lib/shopping-list";
import { cx } from "../../cx";
import { ExternalPhoto, StillLife } from "../StillLife/StillLife";
import styles from "./ShoppingList.module.css";

type ShoppingListProps = {
  /** id of the key-message heading, for the section's aria-labelledby */
  headingId: string;
  /** e.g. 忘年会・新年会のノンアルコール, the first line of the shared list */
  title: string;
  items: readonly ListItem[];
  /** Slugs picked to start with. */
  picked: readonly string[];
  /** Absolute URL of the page, the last line of the shared list. */
  url: string;
};

/**
 * 幹事's list, told by layout: the heading is the answer (「10人なら、7本。」), the headcount is the one big
 * control, and every drink is a row that toggles in and out of the list. Rows stay in place when toggled.
 * Store links carry data-out-* so app/_metrics/Beacons.tsx counts them with source=list. Nothing is stored.
 */
export function ShoppingList({ headingId, title, items, picked, url }: ShoppingListProps) {
  const [headcount, setHeadcount] = useState(DEFAULT_HEADCOUNT);
  const [draft, setDraft] = useState(String(DEFAULT_HEADCOUNT));
  const [chosen, setChosen] = useState<readonly string[]>(picked);
  const [copied, setCopied] = useState(false);

  const lines = useMemo(
    () => listLines(items.filter((item) => chosen.includes(item.slug)), headcount),
    [items, chosen, headcount],
  );
  const units = new Map(lines.map((line) => [line.item.slug, line.units]));
  const total = listTotal(lines);
  const text = listText(title, headcount, lines, url);

  const setCount = (value: number) => {
    const next = clampHeadcount(value);
    setHeadcount(next);
    setDraft(String(next));
  };

  const toggle = (slug: string) => {
    setChosen((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : items.filter((item) => item.slug === slug || current.includes(item.slug)).map((item) => item.slug),
    );
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={styles.list} data-shopping-list="" data-headcount={headcount}>
      <h2 id={headingId} className={styles.key} aria-live="polite" data-total={lines.length > 0 ? total : undefined}>
        {lines.length > 0 ? (
          <>
            <span className={styles.num}>{headcount}</span>人なら、<span className={styles.num}>{total}</span>本。
          </>
        ) : (
          <>ドリンクを選んで</>
        )}
      </h2>

      <div className={styles.stepper} role="group" aria-label="人数">
        <button type="button" className={styles.step} onClick={() => setCount(headcount - 1)} disabled={headcount <= MIN_HEADCOUNT} aria-label="1人減らす">
          −
        </button>
        <label className={styles.count}>
          <input
            className={styles.input}
            type="number"
            inputMode="numeric"
            min={MIN_HEADCOUNT}
            max={MAX_HEADCOUNT}
            value={draft}
            aria-label="人数"
            onChange={(event) => {
              setDraft(event.target.value);
              const value = Number(event.target.value);
              if (event.target.value !== "" && Number.isFinite(value)) {
                setHeadcount(clampHeadcount(value));
              }
            }}
            onBlur={() => setDraft(String(headcount))}
          />
          <span className={styles.unit}>人</span>
        </label>
        <button type="button" className={styles.step} onClick={() => setCount(headcount + 1)} disabled={headcount >= MAX_HEADCOUNT} aria-label="1人増やす">
          ＋
        </button>
      </div>

      <ul className={styles.rows}>
        {items.map((item) => {
          const count = units.get(item.slug);
          const on = count !== undefined;
          const line = lines.find((entry) => entry.item.slug === item.slug);
          return (
            <li
              key={item.slug}
              className={cx(styles.row, on && styles.on)}
              data-list-slug={item.slug}
              data-picked={on ? "true" : "false"}
              data-people={item.people}
              data-share={line?.people}
              data-units={count}
            >
              <button
                type="button"
                className={styles.pick}
                aria-pressed={on}
                aria-label={on ? `${item.name}を外す` : `${item.name}を入れる`}
                onClick={() => toggle(item.slug)}
              >
                <span className={styles.thumb}>
                  <StillLife ratio="fill" radius="sm" fit="plinth">
                    <ExternalPhoto src={item.still} alt="" />
                  </StillLife>
                </span>
                <span className={styles.name}>
                  {item.name}
                  {item.size ? <span className={styles.size}>{item.size}</span> : null}
                </span>
                <span className={styles.mark} aria-hidden="true">
                  {on ? (
                    <>
                      <span className={styles.times}>×</span>
                      <span className={styles.units}>{count}</span>
                    </>
                  ) : (
                    <span className={styles.add}>＋</span>
                  )}
                </span>
              </button>
              {on ? (
                <ul className={styles.stores} aria-label={`${item.name}を買う`}>
                  {item.stores.map((store) => (
                    <li key={store.href}>
                      <a
                        href={store.href}
                        className={styles.store}
                        target="_blank"
                        rel="noopener nofollow"
                        data-out-slug={item.slug}
                        data-out-kind={store.kind}
                        data-out-source={LIST_SOURCE}
                      >
                        {store.text}
                        <span className={styles.arrow} aria-hidden="true">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      {lines.length > 0 ? (
        <div className={styles.send}>
          <a href={lineShareUrl(text)} className={styles.line} target="_blank" rel="noreferrer" data-list-line="">
            LINEで送る
          </a>
          <button type="button" className={styles.copy} onClick={copy} aria-live="polite">
            {copied ? "コピーしました" : "コピー"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** The short call near the top of a scene page that jumps to the list. */
export function ShoppingListCta({ href = "#list" }: { href?: string }) {
  return (
    <a href={href} className={styles.cta}>
      何本いる？<span className={styles.ctaArrow} aria-hidden="true">↓</span>
    </a>
  );
}
