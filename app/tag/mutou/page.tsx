import type { Metadata } from "next";
import {
  DrinkShelf,
  Motion,
  PageIntro,
  Phrase,
  Section,
  SectionHead,
  ShareRow,
  SITE_NAME,
  Stack,
  TableShelf,
  Text,
  TextLink,
} from "@/design-system";
import { vesselGroups } from "@/lib/categories";
import { categorySummaries, SITE_ORIGIN } from "@/lib/drinks";
import { jsonLdText } from "@/lib/jsonld";
import { MUTOU, mutouDescription, mutouJsonLd, resolveMutouTag } from "@/lib/tags";

export function generateMetadata(): Metadata {
  const { drinks } = resolveMutouTag();
  const description = mutouDescription(drinks.length);
  const title = `${MUTOU.title}｜${SITE_NAME}`;
  return {
    title: MUTOU.title,
    description,
    alternates: { canonical: MUTOU.path },
    openGraph: {
      title,
      description,
      url: MUTOU.path,
      siteName: SITE_NAME,
      locale: "ja_JP",
      type: "website",
      images: [{ url: "/og/stylish.jpg", width: 1200, height: 630, alt: `${SITE_NAME} ${MUTOU.title}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function MutouTagPage() {
  const { drinks } = resolveMutouTag();
  const groups = vesselGroups(drinks);
  const others = categorySummaries();

  return (
    <Motion>
      {mutouJsonLd(drinks).map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(data) }} />
      ))}
      <PageIntro
        id="mutou-title"
        step="drink"
        eyebrow="ドリンク"
        title={MUTOU.titleLines}
        lead={MUTOU.lead}
        sublead={`全${drinks.length}本。${groups.map((group) => `${group.short}${group.drinks.length}本`).join("、")}です。`}
      />

      <TableShelf known={drinks.map((drink) => drink.slug)} />

      {groups.map((group, index) => (
        <Section key={group.id} id={group.id} space="md" labelledBy={`vessel-${group.id}`}>
          <SectionHead id={`vessel-${group.id}`} eyebrow={MUTOU.title} title={<Phrase>{group.title}</Phrase>}>
            <Text variant="lead" tone="secondary">
              {group.line}
            </Text>
          </SectionHead>
          <DrinkShelf drinks={group.drinks} opening={index === 0} defer={index > 0} />
        </Section>
      ))}

      <Section space="md" label="ほかの選び方">
        <Stack gap={3}>
          <Text variant="body">
            ほかのカテゴリは、
            {others.map((item, index) => (
              <span key={item.id}>
                <TextLink href={item.href}>{item.category}</TextLink>
                {index < others.length - 1 ? "、" : ""}
              </span>
            ))}
            です。すべてのドリンクは<TextLink href="/drink/">ドリンク一覧</TextLink>にあります。
          </Text>
          <ShareRow url={`${SITE_ORIGIN}${MUTOU.path}`} text={`${MUTOU.title}｜${SITE_NAME}`} />
        </Stack>
      </Section>
    </Motion>
  );
}
