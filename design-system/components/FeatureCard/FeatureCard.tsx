import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "../Button/Button";
import { Chip } from "../Chip/Chip";
import { Stack } from "../Layout/Layout";
import { StillLife } from "../StillLife/StillLife";
import { Eyebrow, Text } from "../Text/Text";
import styles from "./FeatureCard.module.css";

type FeatureCardProps = {
  href: string;
  media: ReactNode;
  folio?: string;
  eyebrow: string;
  title: ReactNode;
  body: ReactNode;
  action: string;
};

/** A whole-card link into the next step of the journey. Never hidden by motion. */
export function FeatureCard({ href, media, folio, eyebrow, title, body, action }: FeatureCardProps) {
  return (
    <Link href={href} className={styles.card} data-rise>
      <div className={styles.media}>
        <StillLife
          ratio="fill"
          radius="none"
          parallax
          hoverZoom
          overlay={folio ? <Chip tone="frost" folio>{folio}</Chip> : undefined}
        >
          {media}
        </StillLife>
      </div>
      <div className={styles.body}>
        <Stack gap={3}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Text as="h3" variant="headline">
            {title}
          </Text>
          <Text variant="body" tone="secondary">
            {body}
          </Text>
        </Stack>
        <Button variant="primary">{action}</Button>
      </div>
    </Link>
  );
}
