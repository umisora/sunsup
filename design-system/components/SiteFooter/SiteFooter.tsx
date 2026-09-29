import { Phrase, TextLink } from "../Text/Text";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.oneliner}>
          <Phrase>飲み会でも、</Phrase>
          <Phrase>おしゃれに美味しく飲める</Phrase>
          <Phrase>ノンアルを届ける</Phrase>
        </p>
        <div className={styles.meta}>
          <p>動物AI達によるサイト運営です。すべての物語はフィクションです。</p>
          <span className={styles.metaLink}>
            <TextLink href="/about">運営</TextLink>
          </span>
        </div>
      </div>
      <p className={styles.giant} aria-hidden="true">
        sunsup
      </p>
    </footer>
  );
}
