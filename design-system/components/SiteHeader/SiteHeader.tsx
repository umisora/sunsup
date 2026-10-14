"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "../../brand";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "/ba/office/", label: "飲み会" },
  { href: "/drink/", label: "ドリンク" },
  { href: "/about/", label: "案内" },
] as const;

function normalize(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export function SiteHeader() {
  const pathname = normalize(usePathname() ?? "/");

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link href="/" className={styles.brand} aria-current={pathname === "/" ? "page" : undefined}>
          <img className={styles.emblem} src="/brand/stylish-mark.svg" alt="" width={134} height={162} />
          <img className={styles.wordmark} src="/brand/stylish-wordmark.svg" alt={SITE_NAME} width={566} height={90} />
          <span className={styles.tagline}>飲み会向けのノンアルコール</span>
        </Link>
        <nav className={styles.nav} aria-label="メニュー">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.link}
              aria-current={
                pathname === normalize(item.href) ? "page" : pathname.startsWith(`${normalize(item.href)}/`) ? "true" : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
