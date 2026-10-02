import type { ReactNode } from "react";
import { Stack } from "../Layout/Layout";
import { Surface } from "../Surface/Surface";
import { Eyebrow, Text } from "../Text/Text";

type ClosingPanelProps = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
};

/** The glass-green close of a page. Holds journey CTAs, so it rises but is never hidden. */
export function ClosingPanel({ id, eyebrow, title, sub, actions }: ClosingPanelProps) {
  return (
    <Surface tone="inverse" padding="xl" radius="lg" rise>
      <Stack gap={6}>
        <Eyebrow tone="inverse">{eyebrow}</Eyebrow>
        <Text as="h2" id={id} variant="statement" tone="inverse">
          {title}
        </Text>
        {sub ? (
          <Text variant="body" tone="inverseMuted">
            {sub}
          </Text>
        ) : null}
        {actions}
      </Stack>
    </Surface>
  );
}
