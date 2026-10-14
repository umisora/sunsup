import Link from "next/link";
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
          <Phrase>飲み会に持っていける</Phrase>
          <Phrase>ノンアルコール飲料を</Phrase>
          <Phrase>集めています。</Phrase>
        </p>
        <nav className={styles.columns} aria-label="フッター">
          <div className={styles.column}>
            <p className={styles.heading}>カテゴリ</p>
            <ul className={styles.links}>
              {categories.map((item) => (
                <li key={item.id}>
                  <Link href={`/drink/#${item.id}`} className={styles.link}>
                    {item.category}
                    <span className={styles.count}>{item.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.column}>
            <p className={styles.heading}>sunsup</p>
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
      <p className={styles.note}>紹介文の一部はフィクションです。</p>
      <p className={styles.giant} aria-hidden="true">
        sunsup
      </p>
    </footer>
  );
}
