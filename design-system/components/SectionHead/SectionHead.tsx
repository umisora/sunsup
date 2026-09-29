import type { ReactNode } from "react";
import { Eyebrow, Text } from "../Text/Text";
import styles from "./SectionHead.module.css";

type SectionHeadProps = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  size?: "headline" | "statement";
  children?: ReactNode;
};

export function SectionHead({ id, eyebrow, title, size = "headline", children }: SectionHeadProps) {
  return (
    <header className={styles.head} data-reveal>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Text as="h2" id={id} variant={size}>
        {title}
      </Text>
      {children}
    </header>
  );
}
