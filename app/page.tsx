import type { Metadata } from "next";
import {
  Button,
  CategoryIndex,
  Chip,
  ChipList,
  DisplayLines,
  DrinkShowcase,
  Eyebrow,
  FeatureCard,
  FillText,
  Grid,
  HeroStage,
  JourneyCta,
  Motion,
  Photo,
  Phrase,
  Section,
  SectionHead,
  Stack,
  TableShelf,
  Text,
  Tile,
} from "@/design-system";
import { categorySummaries, loadDrinks, officeEntries, seasonalPicks, seasonOf } from "@/lib/drinks";

export const metadata: Metadata = {
  title: { absolute: "sunsup" },
  openGraph: {
    title: "sunsup｜飲み会向けのノンアルコール",
    description: "オフィスの飲み会に出すノンアルコール飲料を、場面・見た目・サイズ・味から選べます。",
    url: "/",
    siteName: "sunsup",
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/og/home.jpg", width: 1200, height: 630, alt: "sunsup 飲み会向けのノンアルコール" }],
  },
};

const AXES = [
  { no: "01", title: "場面", line: "次のオフィス飲み会", photo: "place", position: "46% 50%" },
  { no: "02", title: "見た目", line: "テーブルに並べた印象", photo: "peak", position: "38% 50%" },
  { no: "03", title: "サイズ", line: "ひとりで飲み切れる量", photo: "office", position: "80% 50%" },
  { no: "04", title: "味", line: "果汁、炭酸、苦み", photo: "detail", position: "28% 62%" },
] as const;

export default function HomePage() {
  const total = loadDrinks().length;
  const season = seasonalPicks(seasonOf(new Date()), 8);

  return (
    <Motion>
      <HeroStage
        labelledBy="home-title"
        media={<Photo name="table" sizes="(min-width: 960px) 60vw, 100vw" priority />}
        aside={<ChipList tone="frost" label="選び方" items={AXES.map((axis) => axis.title)} intro />}
        title={<DisplayLines id="home-title" variant="tate" lines={["飲み会向けの", "ノンアルコール飲料"]} />}
        actions={
          <>
            <JourneyCta to="ba" intro>
              オフィスの飲み会を見る
            </JourneyCta>
            <Button variant="secondary" href="/drink/" intro>
              {total}本のドリンク
            </Button>
          </>
        }
      >
        <Chip intro>ノンアルコール飲料</Chip>
        <Text variant="lead" intro>
          <Phrase>オフィスの飲み会に</Phrase>
          <Phrase>何を出そう。</Phrase>
        </Text>
      </HeroStage>

      <TableShelf known={loadDrinks().map((drink) => drink.slug)} />

      <Section space="lg" labelledBy="season-title">
        <SectionHead id="season-title" eyebrow="季節のおすすめ" glyph={season.label.charAt(0)} title={<Phrase>{season.label}</Phrase>}>
          <Text variant="lead" tone="secondary">
            {season.line}
          </Text>
        </SectionHead>
        <DrinkShowcase
          label={season.label}
          columns={4}
          drinks={season.drinks.map((drink) => ({ ...drink, label: drink.category }))}
        />
      </Section>

      <Section space="lg" labelledBy="picks-title">
        <SectionHead
          id="picks-title"
          eyebrow="おすすめ"
          title={
            <>
              <Phrase>カテゴリごとに</Phrase>
              <Phrase>まず1本ずつ紹介します。</Phrase>
            </>
          }
        />
        <DrinkShowcase
          label="おすすめ6本"
          drinks={officeEntries().map((drink) => ({ ...drink, label: drink.category }))}
        />
      </Section>

      <Section band space="md" labelledBy="shelves-title">
        <Stack gap={7} align="stretch">
          <Stack gap={4}>
            <Eyebrow tone="inverse">ドリンク</Eyebrow>
            <Text as="h2" id="shelves-title" variant="headline">
              <Phrase>6つのカテゴリから</Phrase>
              <Phrase>選べます。</Phrase>
            </Text>
            <Text variant="body" tone="inverseMuted">
              全{total}本です。写真があるものから並んでいます。
            </Text>
          </Stack>
          <CategoryIndex categories={categorySummaries()} />
        </Stack>
      </Section>

      <Section labelledBy="entry-title">
        <Stack gap={5}>
          <Eyebrow>オフィスの飲み会</Eyebrow>
          <FillText as="h2" id="entry-title" lines={["オフィスの飲み会に", "出すドリンクは", "ここで選べます。"]} />
        </Stack>
      </Section>

      <Section space="md" label="オフィスの飲み会">
        <FeatureCard
          href="/ba/office/"
          media={<Photo name="place" sizes="(min-width: 960px) 720px, calc(100vw - 32px)" />}
          folio="No. 01"
          eyebrow="飲み会"
          title={
            <>
              <Phrase>オフィスの</Phrase>
              <Phrase>オープンな飲み会</Phrase>
            </>
          }
          body="窓のあるオフィスで、デスクのまわりに集まる飲み会です。"
          action="詳しく見る"
        />
      </Section>

      <Section labelledBy="choose-title">
        <SectionHead
          id="choose-title"
          eyebrow="選び方"
          title={
            <>
              <Phrase>場面、見た目、</Phrase>
              <Phrase>サイズ、味</Phrase>
            </>
          }
        />
        <Grid as="ol" columns="quarters" offset>
          {AXES.map((axis) => (
            <Tile
              key={axis.no}
              no={axis.no}
              title={axis.title}
              titleAs="p"
              lines={[axis.line]}
              media={<Photo name={axis.photo} sizes="(min-width: 960px) 300px, 45vw" position={axis.position} decorative />}
            />
          ))}
        </Grid>
      </Section>
    </Motion>
  );
}
