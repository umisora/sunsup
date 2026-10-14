import type { Metadata } from "next";
import {
  SITE_NAME,
  Button,
  CategoryIndex,
  ChipList,
  DisplayLines,
  DrinkShowcase,
  Eyebrow,
  FeatureCard,
  FillText,
  Grid,
  JourneyCta,
  Motion,
  Photo,
  Phrase,
  Section,
  SectionHead,
  Stack,
  TABLE_CAST,
  TableShelf,
  Text,
  VisitHero,
  Tile,
} from "@/design-system";
import { categorySummaries, getDrink, loadDrinks, officeEntries, seasonalPicks, seasonOf } from "@/lib/drinks";
import { DEFAULT_STORY_ID, STORIES, storyById, type Daypart, type Season } from "@/lib/visit";

export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
  openGraph: {
    title: `${SITE_NAME}｜飲み会向けのノンアルコール`,
    description: "オフィスの飲み会に持っていくノンアルコール飲料を、場面と見た目、サイズ、味から探せます。",
    url: "/",
    siteName: SITE_NAME,
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/og/stylish.jpg", width: 1200, height: 630, alt: `${SITE_NAME} 飲み会向けのノンアルコール` }],
  },
};

const AXES = [
  { no: "01", title: "場面", line: "次のオフィス飲み会に持っていけます。", photo: "place", position: "46% 50%" },
  { no: "02", title: "見た目", line: "テーブルに並べると、部屋に合います。", photo: "peak", position: "38% 50%" },
  { no: "03", title: "サイズ", line: "ひとりで飲み切れる量です。", photo: "office", position: "80% 50%" },
  { no: "04", title: "味", line: "果汁と炭酸、苦みがあります。", photo: "detail", position: "28% 62%" },
] as const;

const SEASONS: readonly Season[] = ["spring", "summer", "autumn", "winter"];
const DAYPARTS: readonly Daypart[] = ["morning", "afternoon", "evening"];

function assertVisitCatalog(): void {
  if (!storyById(DEFAULT_STORY_ID)) {
    throw new Error("default visit story missing");
  }
  const seen = new Set<string>();
  for (const item of STORIES) {
    if (seen.has(item.id)) {
      throw new Error(`duplicate visit story ${item.id}`);
    }
    seen.add(item.id);
    if (item.slugs.length < 2 || item.slugs.length > 3) {
      throw new Error(`${item.id} needs 2 or 3 drinks`);
    }
    if ([...item.kicker].length > 8 || [...item.lead[0]].length > 32 || [...item.lead[1]].length > 32) {
      throw new Error(`${item.id} copy is too long`);
    }
    if (!item.lead[0].endsWith("。") || !item.lead[1].endsWith("。")) {
      throw new Error(`${item.id} lead is not a sentence`);
    }
    for (const slug of item.slugs) {
      const drink = getDrink(slug);
      const cast = TABLE_CAST[slug];
      if (!drink || !cast) {
        throw new Error(`visit drink missing: ${slug}`);
      }
      if (drink.stillUrl !== cast.src || drink.name !== cast.name) {
        throw new Error(`visit still changed: ${slug}`);
      }
      if (!drink.stillUrl.startsWith("/drinks/") || drink.stillUrl.includes("fallback-")) {
        throw new Error(`visit still invalid: ${slug}`);
      }
    }
  }
  for (const season of SEASONS) {
    for (const daypart of DAYPARTS) {
      const hit = STORIES.some((item) => item.season === season && item.daypart === daypart && !item.weather && !item.region);
      if (!hit) {
        throw new Error(`missing ${season} ${daypart} fallback`);
      }
    }
  }
}

assertVisitCatalog();

export default function HomePage() {
  const total = loadDrinks().length;
  const season = seasonalPicks(seasonOf(new Date()), 8);

  return (
    <Motion>
      <VisitHero
        labelledBy="home-title"
        initialId={DEFAULT_STORY_ID}
        aside={<ChipList tone="frost" label="選び方" items={AXES.map((axis) => axis.title)} intro />}
        title={<DisplayLines id="home-title" variant="tate" lines={["飲み会向けの", "ノンアルコール飲料"]} />}
        actions={
          <JourneyCta to="ba" intro>
            オフィスの飲み会を見る
          </JourneyCta>
        }
      />

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
              <Phrase>飲み会へ出せる1本です。</Phrase>
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
              全{total}本です。写真のあるものから並んでいます。
            </Text>
            <Button variant="inverse" href="/drink/">
              {total}本のドリンク
            </Button>
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
          body="窓のあるオフィスで、デスクのまわりに誰でも集まれる飲み会です。"
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
