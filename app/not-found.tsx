import { Eyebrow, Section, Stack, Text, TextLink } from "@/design-system";

export default function NotFound() {
  return (
    <Section space="md" labelledBy="not-found-title">
      <Stack gap={5}>
        <Eyebrow>sunsup</Eyebrow>
        <Text as="h1" id="not-found-title" variant="headline">
          このページはありません。
        </Text>
        <Text variant="lead">
          <TextLink href="/">入口へ</TextLink>
        </Text>
      </Stack>
    </Section>
  );
}
