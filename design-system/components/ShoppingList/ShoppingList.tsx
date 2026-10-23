"use client";

import { useId, useMemo, useState } from "react";
import {
  clampHeadcount,
  DEFAULT_HEADCOUNT,
  LIST_SOURCE,
  lineShareUrl,
  listLines,
  listText,
  MAX_HEADCOUNT,
  MIN_HEADCOUNT,
  unitNote,
  type ListItem,
} from "@/lib/shopping-list";
import styles from "./ShoppingList.module.css";

type ShoppingListProps = {
  /** e.g. 忘年会のノンアルコール */
  title: string;
  items: readonly ListItem[];
  /** Slugs picked to start with. */
  picked: readonly string[];
  /** Absolute URL of the page, sent with the list. */
  url: string;
};

/**
 * The organiser enters the headcount and gets how many of each picked drink to buy.
 * Store links carry data-out-* so app/_metrics/Beacons.tsx counts them with source=list.
 * Nothing is stored: the list lives in the page until it is sent or copied.
 */
export function ShoppingList({ title, items, picked, url }: ShoppingListProps) {
  const id = useId();
  const [headcount, setHeadcount] = useState(DEFAULT_HEADCOUNT);
  const [draft, setDraft] = useState(String(DEFAULT_HEADCOUNT));
  const [chosen, setChosen] = useState<readonly string[]>(picked);
  const [copied, setCopied] = useState(false);

  const lines = useMemo(
    () => listLines(items.filter((item) => chosen.includes(item.slug)), headcount),
    [items, chosen, headcount],
  );
  const total = lines.reduce((sum, line) => sum + line.units, 0);
  const text = listText(title, headcount, lines, url);

  const setCount = (value: number) => {
    const next = clampHeadcount(value);
    setHeadcount(next);
    setDraft(String(next));
  };

  const toggle = (slug: string) => {
    setChosen((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : items.filter((item) => item.slug === slug || current.includes(item.slug)).map((item) => item.slug),
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
      <div className={styles.count}>
        <label htmlFor={`${id}-count`} className={styles.label}>
          人数
        </label>
        <div className={styles.stepper}>
          <button type="button" className={styles.step} onClick={() => setCount(headcount - 1)} disabled={headcount <= MIN_HEADCOUNT} aria-label="1人減らす">
            −
          </button>
          <input
            id={`${id}-count`}
            className={styles.input}
            type="number"
            inputMode="numeric"
            min={MIN_HEADCOUNT}
            max={MAX_HEADCOUNT}
            value={draft}
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
          <button type="button" className={styles.step} onClick={() => setCount(headcount + 1)} disabled={headcount >= MAX_HEADCOUNT} aria-label="1人増やす">
            ＋
          </button>
        </div>
      </div>

      {lines.length > 0 ? (
        <ol className={styles.lines} aria-live="polite">
          {lines.map((line) => (
            <li key={line.item.slug} className={styles.line} data-list-slug={line.item.slug} data-people={line.item.people} data-share={line.people} data-units={line.units}>
              <div className={styles.head}>
                <a href={`/drink/${line.item.slug}/`} className={styles.name}>
                  {line.item.name}
                </a>
                <p className={styles.units}>{line.units}本</p>
              </div>
              <p className={styles.note}>
                {line.people}人で飲む分。{unitNote(line.item)}。
              </p>
              <ul className={styles.stores} aria-label={`${line.item.name}を買えるお店`}>
                {line.item.stores.map((store) => (
                  <li key={store.href}>
                    <a
                      href={store.href}
                      className={styles.store}
                      target="_blank"
                      rel="noopener nofollow"
                      data-out-slug={line.item.slug}
                      data-out-kind={store.kind}
                      data-out-source={LIST_SOURCE}
                    >
                      {store.text}で見る
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.empty}>ドリンクを一つ以上選んでください。</p>
      )}

      {lines.length > 0 ? (
        <>
          <p className={styles.total}>
            合計 <strong>{total}本</strong>
          </p>
          <div className={styles.actions}>
            <a href={lineShareUrl(text)} className={styles.action} target="_blank" rel="noreferrer" data-list-line="">
              LINEで送る
            </a>
            <button type="button" className={styles.action} onClick={copy} aria-live="polite">
              {copied ? "コピーしました" : "リストをコピー"}
            </button>
          </div>
        </>
      ) : null}

      <details className={styles.pick}>
        <summary className={styles.summary}>ドリンクを選びなおす</summary>
        <ul className={styles.choices}>
          {items.map((item) => (
            <li key={item.slug}>
              <label className={styles.choice}>
                <input type="checkbox" checked={chosen.includes(item.slug)} onChange={() => toggle(item.slug)} />
                <span>{item.name}</span>
                <span className={styles.serving}>{item.servingText}</span>
              </label>
            </li>
          ))}
        </ul>
      </details>

      <p className={styles.fine}>本数は目安です。大きな瓶は、一人180mlとして数えています。値段や在庫は、それぞれのお店で確かめてください。</p>
    </div>
  );
}
