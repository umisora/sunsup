import Link from "next/link";
import type { CategoryLink } from "../CategoryNav/CategoryNav";
import { Phrase } from "../Text/Text";
import styles from "./SiteFooter.module.css";

const NAV = [
  { href: "/ba/office/", label: "場" },
  { href: "/drink/", label: "一覧" },
  { href: "/about/", label: "運営" },
] as const;

export function SiteFooter({ categories }: { categories: readonly CategoryLink[] }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.oneliner}>
          <Phrase>飲み会でも、</Phrase>
          <Phrase>おしゃれに美味しく飲める</Phrase>
          <Phrase>ノンアルを届ける</Phrase>
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
      <p className={styles.note}>動物AI達によるサイト運営です。すべての物語はフィクションです。</p>
      <p className={styles.giant} aria-hidden="true">
        sunsup
      </p>
    </footer>
  );
}
