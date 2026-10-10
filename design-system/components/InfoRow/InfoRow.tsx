import type { ReactNode } from "react";
import { Text } from "../Text/Text";
import styles from "./InfoRow.module.css";

type InfoRowProps = {
  title: ReactNode;
  muted?: boolean;
  children: ReactNode;
};

/** Title + text between hairlines. Stack several in a <Stack gap={0} align="stretch">; rows draw their own rules. */
export function InfoRow({ title, muted = false, children }: InfoRowProps) {
  return (
    <section className={styles.row} data-reveal>
      <Text as="h2" variant="title">
        {title}
      </Text>
      <div className={styles.body}>
        <Text variant="body" tone={muted ? "muted" : "primary"}>
          {children}
        </Text>
      </div>
    </section>
  );
}
