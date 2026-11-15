import { DISCLOSURE_LABEL, DISCLOSURE_NEAR_BUTTON } from "@/lib/disclosure";
import { cx } from "../../cx";
import styles from "./AdDisclosure.module.css";

type AdDisclosureProps = {
  /** Inverse surfaces (the closing card) use the light-on-dark note. */
  tone?: "default" | "inverse";
  className?: string;
};

/** PR mark and the near-button note. Copy lives in lib/disclosure.ts. */
export function AdDisclosure({ tone = "default", className }: AdDisclosureProps) {
  return (
    <p className={cx(styles.note, tone === "inverse" && styles.inverse, className)} data-ad-disclosure="">
      <span className={styles.mark}>{DISCLOSURE_LABEL}</span>
      <span>{DISCLOSURE_NEAR_BUTTON}</span>
    </p>
  );
}
