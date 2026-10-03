import type { Metadata } from "next";
import {
  ExternalPhoto,
  InfoRow,
  Motion,
  PageIntro,
  Phrase,
  Section,
  SectionHead,
  Stack,
  StillLife,
  TextLink,
} from "@/design-system";
import { drinkGroups } from "@/lib/drinks";

export const metadata: Metadata = {
  title: "一杯の一覧",
  description: "オフィスの卓に置くノンアルを、カテゴリから開く。入口の六杯の先に、残りがある。",
  alternates: { canonical: "/drink/" },
};

export default function DrinkIndexPage() {
  const groups = drinkGroups();
  const leadSlug = groups.flatMap((group) => group.drinks).find((drink) => drink.stillUrl)?.slug;

  return (
    <Motion>
      <PageIntro
        id="list-title"
        eyebrow="一覧"
        title={["一杯の一覧"]}
        lead="場の六杯は入口です。同じカテゴリの残りを、ここから開く。"
      />
      {groups.map((group) => (
        <Section key={group.id} space="md" labelledBy={`cat-${group.id}`}>
          <Stack gap={4}>
            <SectionHead id={`cat-${group.id}`} eyebrow="カテゴリ" title={<Phrase>{group.category}</Phrase>} />
            <Stack gap={5} align="stretch">
              {group.drinks.map((drink) => (
                <Stack key={drink.slug} gap={3} align="stretch">
                  {drink.stillUrl ? (
                    <StillLife ratio="4:3" radius="lg">
                      <ExternalPhoto src={drink.stillUrl} alt={drink.name} priority={drink.slug === leadSlug} />
                    </StillLife>
                  ) : null}
                  <InfoRow title={<TextLink href={`/drink/${drink.slug}/`}>{drink.name}</TextLink>}>{drink.size}</InfoRow>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Section>
      ))}
    </Motion>
  );
}
