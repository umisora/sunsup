import styles from "./SkipLink.module.css";

export function SkipLink({ target }: { target: string }) {
  return (
    <a className={styles.skip} href={`#${target}`}>
      本文へ
    </a>
  );
}
