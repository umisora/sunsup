"use client";

import { useState } from "react";
import {
  clampHeadcount,
  DEFAULT_HEADCOUNT,
  LIST_SOURCE,
  lineShareUrl,
  MAX_HEADCOUNT,
  MIN_HEADCOUNT,
  ROLE_INFO,
  setLines,
  setText,
  setTotal,
  type SetCard,
  type SetRole,
} from "@/lib/shopping-list";
import { cx } from "../../cx";
import { ExternalPhoto, StillLife } from "../StillLife/StillLife";
import styles from "./ShoppingList.module.css";

type ShoppingListProps = {
  /** id of the heading, for the section's aria-labelledby */
  headingId: string;
  /** e.g. 忘年会・新年会のソフトドリンク, the first line of the shared list */
  title: string;
  /** 乾杯用, テーブル用, 食事用; items[0] of each is STYLISH!'s pick */
  cards: readonly SetCard[];
  /** Absolute URL of the page, the last line of the shared list. */
  url: string;
};

/**
 * STYLISH!'s recommended set: the heading says what we recommend, each card says why, and the
 * headcount of people toasting with a soft drink turns into bottles per role. Each card can swap its
 * drink for another of the same role. Store links carry data-out-* so app/_metrics/Beacons.tsx counts
 * them with source=list. Nothing is stored.
 */
export function ShoppingList({ headingId, title, cards, url }: ShoppingListProps) {
  const [headcount, setHeadcount] = useState(DEFAULT_HEADCOUNT);
  const [draft, setDraft] = useState(String(DEFAULT_HEADCOUNT));
  const [picks, setPicks] = useState<Partial<Record<SetRole, string>>>({});
  const [copied, setCopied] = useState(false);

  const shown = cards.filter((card) => card.items.length > 0);
  const lines = setLines(shown, picks, headcount);
  const total = setTotal(lines);
  const text = setText(title, headcount, lines, url);

  const setCount = (value: number) => {
    const next = clampHeadcount(value);
    setHeadcount(next);
    setDraft(String(next));
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
      <p className={styles.tag}>STYLISH!のおすすめ</p>
      <h2 id={headingId} className={styles.key}>
        乾杯のソフトドリンクは、
        <br />
        この<span className={styles.num}>{shown.length}</span>種類で
      </h2>

      <div className={styles.people}>
        <span className={styles.peopleLabel} id={`${headingId}-people`}>
          ソフトドリンクで乾杯する人
        </span>
        <div className={styles.stepper} role="group" aria-labelledby={`${headingId}-people`}>
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
              aria-label="ソフトドリンクで乾杯する人の数"
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
      </div>

      <ul className={styles.cards}>
        {lines.map((line) => {
          const card = shown.find((entry) => entry.role === line.role)!;
          const others = card.items.filter((item) => item.slug !== line.item.slug);
          const label = ROLE_INFO[line.role].label;
          return (
            <li key={line.role} className={styles.card} data-list-role={line.role} data-list-slug={line.item.slug} data-units={line.units}>
              <div className={styles.top}>
                <span className={styles.photo}>
                  <StillLife ratio="fill" radius="sm" fit="plinth">
                    <ExternalPhoto src={line.item.still} alt="" />
                  </StillLife>
                </span>
                <div className={styles.body}>
                  <span className={styles.role}>{label}</span>
                  <p className={styles.name}>
                    {line.item.name}
                    {line.item.size ? <span className={styles.size}>{line.item.size}</span> : null}
                  </p>
                  <p className={styles.why}>{card.reason}</p>
                </div>
                <p className={styles.units} aria-live="polite">
                  <span className={styles.unitsNum}>{line.units}</span>
                  <span className={styles.times}>本</span>
                </p>
              </div>
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
                      {store.text}
                      <span className={styles.arrow} aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
              {others.length > 0 ? (
                <div className={styles.alt}>
                  <span className={styles.altLabel}>ほかの候補</span>
                  <ul className={styles.altRow}>
                    {card.items.map((item) => {
                      const on = item.slug === line.item.slug;
                      return (
                        <li key={item.slug} className={cx(on && styles.altHidden)}>
                          <button
                            type="button"
                            className={styles.swap}
                            aria-pressed={on}
                            aria-label={`${label}を${item.name}に替える`}
                            data-list-swap={item.slug}
                            disabled={on}
                            onClick={() => setPicks((current) => ({ ...current, [line.role]: item.slug }))}
                          >
                            <StillLife ratio="fill" radius="sm" fit="plinth">
                              <ExternalPhoto src={item.still} alt="" />
                            </StillLife>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className={styles.total} data-total={total}>
        <span className={styles.totalLabel}>全部で</span>
        <span className={styles.totalNum}>
          {total}
          <span className={styles.times}>本</span>
        </span>
      </p>

      <div className={styles.send}>
        <a href={lineShareUrl(text)} className={styles.line} target="_blank" rel="noreferrer" data-list-line="">
          買い出しの人にLINEで送る
        </a>
        <button type="button" className={styles.copy} onClick={copy} aria-live="polite">
          {copied ? "コピーしました" : "コピー"}
        </button>
      </div>
    </div>
  );
}

/** The short call near the top of a scene page that jumps to the set. */
export function ShoppingListCta({ href = "#list" }: { href?: string }) {
  return (
    <a href={href} className={styles.cta}>
      ソフトドリンクのおすすめを見る<span className={styles.ctaArrow} aria-hidden="true">↓</span>
    </a>
  );
}
