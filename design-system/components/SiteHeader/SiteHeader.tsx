"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "/ba/office/", label: "場" },
  { href: "/drink/", label: "一覧" },
  { href: "/about/", label: "運営" },
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
          <span className={styles.mark}>sunsup</span>
          <span className={styles.tagline}>おしゃれに美味しく飲めるノンアル</span>
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
