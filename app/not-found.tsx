import { Eyebrow, Section, SITE_NAME, Stack, Text, TextLink } from "@/design-system";
import { SITE_DESCRIPTION } from "@/design-system/brand";
import { jsonLdText, routeJsonLd } from "@/lib/jsonld";

export default function NotFound() {
  return (
    <>
      {routeJsonLd({ path: "/404/", title: SITE_NAME, absoluteTitle: true, description: SITE_DESCRIPTION }).map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(data) }} />
      ))}
      <Section space="md" labelledBy="not-found-title">
        <Stack gap={5}>
          <Eyebrow>{SITE_NAME}</Eyebrow>
          <Text as="h1" id="not-found-title" variant="headline">
            このページはありません。
          </Text>
          <Text variant="lead">
            <TextLink href="/">トップへ戻る</TextLink>
          </Text>
        </Stack>
      </Section>
    </>
  );
}
