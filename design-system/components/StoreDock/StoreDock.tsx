"use client";

import { useEffect, useState } from "react";
import styles from "./StoreDock.module.css";

type StoreDockProps = {
  name: string;
  href: string;
  action: string;
  /** Hide the dock while this element is on screen or still below it. */
  anchorId: string;
};

/** Keeps the store one tap away once the page's own store button has scrolled out of view. */
export function StoreDock({ name, href, action, anchorId }: StoreDockProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const anchor = document.getElementById(anchorId);
    if (!anchor) {
      return;
    }
    const covering = new Set<Element>();
    let anchorAbove = false;
    const update = () => setShown(anchorAbove && covering.size === 0);

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === anchor) {
          anchorAbove = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        } else if (entry.isIntersecting) {
          covering.add(entry.target);
        } else {
          covering.delete(entry.target);
        }
      }
      update();
    });
    observer.observe(anchor);
    document.querySelectorAll("[data-dock-cover], footer").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [anchorId]);

  return (
    <div className={styles.dock} data-shown={shown || undefined} aria-hidden={!shown || undefined}>
      <p className={styles.name}>{name}</p>
      <a href={href} className={styles.action} target="_blank" rel="noopener nofollow" tabIndex={shown ? undefined : -1}>
        {action}
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M1 11 11 1M3 1h8v8" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </a>
    </div>
  );
}
