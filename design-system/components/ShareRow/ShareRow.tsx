"use client";

import { useState } from "react";
import { cx } from "../../cx";
import styles from "./ShareRow.module.css";

type ShareRowProps = {
  /** Absolute URL of the page. */
  url: string;
  /** Line that travels with the link. */
  text: string;
  tone?: "light" | "inverse";
};

/** Send this page to LINE or X, or copy its link. Plain intent links: nothing is counted. */
export function ShareRow({ url, text, tone = "light" }: ShareRowProps) {
  const [copied, setCopied] = useState(false);
  const line = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
  const post = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={cx(styles.row, tone === "inverse" && styles.inverse)}>
      <p className={styles.label}>送る</p>
      <ul className={styles.list}>
        <li>
          <a href={line} className={styles.pill} target="_blank" rel="noreferrer">
            LINE
          </a>
        </li>
        <li>
          <a href={post} className={styles.pill} target="_blank" rel="noreferrer">
            X
          </a>
        </li>
        <li>
          <button type="button" className={styles.pill} onClick={copy} aria-live="polite">
            {copied ? "コピーしました" : "リンクをコピー"}
          </button>
        </li>
      </ul>
    </div>
  );
}
