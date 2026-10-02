import type { ReactNode } from "react";
import { cx } from "../../cx";
import type { JourneyStep } from "../../journey";
import { JourneySteps } from "../JourneySteps/JourneySteps";
import { Stack } from "../Layout/Layout";
import layout from "../Layout/Layout.module.css";
import { StillLife } from "../StillLife/StillLife";
import { DisplayLines, Eyebrow, Numeral, Text } from "../Text/Text";
import styles from "./PageIntro.module.css";

type PageIntroProps = {
  id: string;
  step?: JourneyStep;
  folio?: string;
  eyebrow: string;
  title: readonly string[];
  lead?: ReactNode;
  sublead?: ReactNode;
  /** A priority <Photo>. With media the intro is a split hero; without, title and lead sit side by side. */
  media?: ReactNode;
  /** Less padding, so a following full-viewport stage still fits in the first screen. */
  compact?: boolean;
};

/** Top of every inner page: journey position, eyebrow, masked title, lead. */
export function PageIntro({ id, step, folio, eyebrow, title, lead, sublead, media, compact = false }: PageIntroProps) {
  const heading = (
    <Stack gap={5}>
      {step ? <JourneySteps current={step} /> : null}
      {folio ? (
        <Numeral size="md" intro>
          {folio}
        </Numeral>
      ) : null}
      <Eyebrow intro>{eyebrow}</Eyebrow>
      <DisplayLines id={id} lines={title} />
    </Stack>
  );

  const leads =
    lead || sublead ? (
      <Stack gap={2}>
        {lead ? (
          <Text variant="lead" intro>
            {lead}
          </Text>
        ) : null}
        {sublead ? (
          <Text variant="small" tone="muted" intro>
            {sublead}
          </Text>
        ) : null}
      </Stack>
    ) : null;

  if (media) {
    return (
      <section className={cx(layout.wrap, styles.intro, styles.withMedia, compact && styles.compact)} aria-labelledby={id}>
        <Stack gap={5}>
          {heading}
          {leads}
        </Stack>
        <div className={styles.media}>
          <StillLife ratio="4:5" radius="lg" intro parallax>
            {media}
          </StillLife>
        </div>
      </section>
    );
  }

  return (
    <section className={cx(layout.wrap, styles.intro, styles.titleOnly, compact && styles.compact)} aria-labelledby={id}>
      {heading}
      {leads}
    </section>
  );
}
