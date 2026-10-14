import { SITE_NAME } from "../../brand";
import styles from "./Logo.module.css";

/** The owner's stacked mark, used where the name is the heading. */
export function LogoTitle({ id }: { id: string }) {
  return (
    <h1 id={id} className={styles.title}>
      <img className={styles.lockup} src="/brand/stylish-logo.svg" alt={SITE_NAME} width={350} height={332} />
    </h1>
  );
}
