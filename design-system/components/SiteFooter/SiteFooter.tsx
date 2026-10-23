import Link from "next/link";
import { SITE_NAME } from "../../brand";
import type { CategoryLink } from "../CategoryNav/CategoryNav";
import { Phrase } from "../Text/Text";
import styles from "./SiteFooter.module.css";

const NAV = [
  { href: "/ba/office/", label: "飲み会" },
  { href: "/drink/", label: "ドリンク" },
  { href: "/about/", label: "案内" },
] as const;

export function SiteFooter({ categories }: { categories: readonly CategoryLink[] }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.oneliner}>
          <Phrase>飲み会を任された人へ。</Phrase>
          <Phrase>持っていくノンアルコールを</Phrase>
          <Phrase>集めています。</Phrase>
        </p>
        <nav className={styles.columns} aria-label="フッター">
          <div className={styles.column}>
            <p className={styles.heading}>カテゴリ</p>
            <ul className={styles.links}>
              {categories.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className={styles.link}>
                    {item.category}
                    <span className={styles.count}>{item.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.column}>
            <p className={styles.heading}>{SITE_NAME}</p>
            <ul className={styles.links}>
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
      <p className={styles.note}>紹介文の一部は企画のためのフィクションです。</p>
      <p className={styles.giant} aria-hidden="true">
        {SITE_NAME}
      </p>
    </footer>
  );
}
