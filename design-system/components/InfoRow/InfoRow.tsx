import type { ReactNode } from "react";
import { Surface } from "../Surface/Surface";
import { Text } from "../Text/Text";
import styles from "./InfoRow.module.css";

type InfoRowProps = {
  title: string;
  muted?: boolean;
  children: ReactNode;
};

/** Title + text on a raised card. Stack several in a <Stack gap={3} align="stretch">. */
export function InfoRow({ title, muted = false, children }: InfoRowProps) {
  return (
    <Surface tone="raised" as="section" reveal>
      <div className={styles.row}>
        <Text as="h2" variant="title">
          {title}
        </Text>
        <div className={styles.body}>
          <Text variant="body" tone={muted ? "muted" : "primary"}>
            {children}
          </Text>
        </div>
      </div>
    </Surface>
  );
}
