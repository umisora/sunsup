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
    title: "sunsup｜飲み会でも、おしゃれに美味しく。",
    description: "次のオフィスの卓に、何を置くか。おしゃれに美味しく飲めるノンアルを、場・見た目・サイズ・味から。",
    url: "/",
    siteName: "sunsup",
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/og/home.jpg", width: 1200, height: 630, alt: "sunsup 飲み会でも、おしゃれに美味しく。" }],
  },
};

const AXES = [
  { no: "01", title: "場", line: "次のオフィスの午後。", photo: "place", position: "46% 50%" },
  { no: "02", title: "見た目", line: "卓に馴染むか。", photo: "peak", position: "38% 50%" },
  { no: "03", title: "サイズ", line: "一人が飲み切る。", photo: "office", position: "80% 50%" },
  { no: "04", title: "味", line: "果実、炭酸、苦み。", photo: "detail", position: "28% 62%" },
] as const;

export default function HomePage() {
  const total = loadDrinks().length;
  const season = seasonalPicks(seasonOf(new Date()), 8);

  return (
    <Motion>
      <HeroStage
        labelledBy="home-title"
        media={<Photo name="table" sizes="(min-width: 960px) 60vw, 100vw" priority />}
        aside={<ChipList tone="frost" label="選ぶ軸" items={AXES.map((axis) => axis.title)} intro />}
        title={<DisplayLines id="home-title" variant="tate" lines={["飲み会でも、", "おしゃれに美味しく。"]} />}
        actions={
          <>
            <JourneyCta to="ba" intro>
              次の卓の場を見る
            </JourneyCta>
            <Button variant="secondary" href="/drink/" intro>
              {total}本の一覧
            </Button>
          </>
        }
      >
        <Chip intro>コンセプトサイト</Chip>
        <Text variant="lead" intro>
          <Phrase>次のオフィスの卓に、</Phrase>
          <Phrase>何を置くか。</Phrase>
        </Text>
      </HeroStage>

      <TableShelf />

      <Section space="lg" labelledBy="season-title">
        <SectionHead id="season-title" eyebrow="季節の卓" glyph={season.label.charAt(0)} title={<Phrase>{season.label}</Phrase>}>
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
          eyebrow="入口の六杯"
          title={
            <>
              <Phrase>カテゴリごとに、</Phrase>
              <Phrase>まず一杯。</Phrase>
            </>
          }
        />
        <DrinkShowcase
          label="入口の六杯"
          drinks={officeEntries().map((drink) => ({ ...drink, label: drink.category }))}
        />
      </Section>

      <Section band space="md" labelledBy="shelves-title">
        <Stack gap={7} align="stretch">
          <Stack gap={4}>
            <Eyebrow tone="inverse">一覧</Eyebrow>
            <Text as="h2" id="shelves-title" variant="headline">
              <Phrase>六つの棚から、</Phrase>
              <Phrase>次の一杯を。</Phrase>
            </Text>
            <Text variant="body" tone="inverseMuted">
              全{total}本。写真のある一杯から並ぶ。
            </Text>
          </Stack>
          <CategoryIndex categories={categorySummaries()} />
        </Stack>
      </Section>

      <Section labelledBy="entry-title">
        <Stack gap={5}>
          <Eyebrow>入口</Eyebrow>
          <FillText as="h2" id="entry-title" lines={["次の卓のために。", "次の飲み会に、", "何を置くか。"]} />
        </Stack>
      </Section>

      <Section space="md" label="最初の場">
        <FeatureCard
          href="/ba/office/"
          media={<Photo name="place" sizes="(min-width: 960px) 720px, calc(100vw - 32px)" />}
          folio="No. 01"
          eyebrow="場"
          title={
            <>
              <Phrase>オフィスの</Phrase>
              <Phrase>オープンな飲み会</Phrase>
            </>
          }
          body="デスクが卓になる。窓のあるITの会社。"
          action="次の卓の場を見る"
        />
      </Section>

      <Section labelledBy="choose-title">
        <SectionHead
          id="choose-title"
          eyebrow="選ぶ"
          title={
            <>
              <Phrase>場、見た目、</Phrase>
              <Phrase>サイズ、味。</Phrase>
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
