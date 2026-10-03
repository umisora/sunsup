import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Chip,
  ClosingPanel,
  ExternalPhoto,
  InfoRow,
  Motion,
  Phrase,
  Section,
  SectionHead,
  Stack,
  StillLife,
  StoreSlot,
  Text,
  TextLink,
} from "@/design-system";
import { drinkDescription, drinkTitle, getDrink, loadDrinks, relatedDrinks, shareImage, storeRows } from "@/lib/drinks";

type DrinkPageProps = {
  params: Promise<{ slug: string }>;
};

const AXES = [
  { key: "place", title: "場" },
  { key: "look", title: "見た目" },
  { key: "size", title: "サイズ" },
  { key: "taste", title: "味" },
] as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return loadDrinks().map((drink) => ({ slug: drink.slug }));
}

export async function generateMetadata({ params }: DrinkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const drink = getDrink(slug);
  if (!drink) {
    return { title: "このページはありません" };
  }
  const title = drinkTitle(drink);
  const description = drinkDescription(drink);
  const image = shareImage(drink);
  return {
    title,
    description,
    alternates: { canonical: `/drink/${drink.slug}/` },
    openGraph: {
      title: `${title}｜sunsup`,
      description,
      url: `/drink/${drink.slug}/`,
      siteName: "sunsup",
      locale: "ja_JP",
      type: "article",
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function DrinkPage({ params }: DrinkPageProps) {
  const { slug } = await params;
  const drink = getDrink(slug);
  if (!drink) {
    notFound();
  }

  const rows = storeRows(drink);
  const related = relatedDrinks(drink);

  return (
    <Motion>
      {drink.stillUrl ? (
        <Section space="md" label="静物">
          <StillLife ratio="4:3" radius="lg" intro parallax>
            <ExternalPhoto src={drink.stillUrl} alt={drink.name} priority />
          </StillLife>
        </Section>
      ) : null}

      <Section space="md" labelledBy="drink-title">
        <Stack gap={4}>
          {drink.category ? <Chip intro>{drink.category}</Chip> : null}
          <Text as="h1" id="drink-title" variant="headline" intro>
            {drink.name}
          </Text>
        </Stack>
      </Section>

      <Section space="md" label="この一杯">
        <Stack gap={3} align="stretch">
          {AXES.map((axis) => (
            <InfoRow key={axis.key} title={axis.title}>
              {drink[axis.key]}
            </InfoRow>
          ))}
        </Stack>
      </Section>

      {related.length > 0 ? (
        <Section space="md" labelledBy="related-title">
          <Stack gap={4}>
            <SectionHead id="related-title" eyebrow={drink.category} title={<Phrase>同じカテゴリ</Phrase>} />
            <Stack gap={3} align="stretch">
              {related.map((other) => (
                <InfoRow key={other.slug} title={<TextLink href={`/drink/${other.slug}/`}>{other.name}</TextLink>}>
                  {other.size}
                </InfoRow>
              ))}
            </Stack>
            <Text variant="small">
              <TextLink href="/drink/">一覧</TextLink>
            </Text>
          </Stack>
        </Section>
      ) : null}

      <Section labelledBy="close-title">
        <ClosingPanel
          id="close-title"
          eyebrow="次の飲み会"
          title={
            <>
              <Phrase>次の飲み会に、</Phrase>
              <Phrase>これを置く。</Phrase>
            </>
          }
        />
        {rows.length > 0 ? <StoreSlot rows={rows} /> : null}
      </Section>
    </Motion>
  );
}
