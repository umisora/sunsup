import type { Metadata } from "next";
import {
  DrinkShowcase,
  Eyebrow,
  FillText,
  Grid,
  JourneyCta,
  MediaPanel,
  Motion,
  PageIntro,
  Photo,
  Phrase,
  Section,
  SectionHead,
  ShareRow,
  Stack,
  Text,
  TextLink,
  Tile,
} from "@/design-system";
import { officeEntries, seasonalPicks, seasonOf, SITE_ORIGIN } from "@/lib/drinks";

export const metadata: Metadata = {
  title: "オフィスのオープンな飲み会",
  description: "次にデスクが卓になる午後。ITの会社の、開いた飲み会に置くノンアル。",
  openGraph: {
    title: "オフィスのオープンな飲み会｜sunsup",
    description: "次にデスクが卓になる午後。ITの会社の、開いた飲み会に置くノンアル。",
    url: "/ba/office/",
    siteName: "sunsup",
    locale: "ja_JP",
    type: "article",
    images: [{ url: "/og/office.jpg", width: 1200, height: 630, alt: "sunsup 場 オフィスのオープンな飲み会" }],
  },
};

const CRITERIA = [
  {
    no: "01",
    title: "見た目",
    lines: ["卓に置いたとき、場の空気に合うものを選びます。", "緑のガラス。短い缶。ラベルが、午後の卓に馴染むもの。"],
  },
  {
    no: "02",
    title: "サイズ",
    lines: ["一人が、その場で飲み切る量。", "卓で分けられる瓶。短い缶。"],
  },
  {
    no: "03",
    title: "味",
    lines: ["果実、炭酸、苦み。冷たいこと。", "乾杯の気泡は、炭酸の瓶で足ります。"],
  },
] as const;

export default function OfficePage() {
  const season = seasonalPicks(seasonOf(new Date()), 4);

  return (
    <Motion>
      <PageIntro
        id="office-title"
        step="ba"
        folio="No. 01"
        eyebrow="場"
        title={["オフィスの", "オープンな飲み会"]}
        lead="次にデスクが卓になる午後。"
        media={<Photo name="office" sizes="(min-width: 960px) 720px, calc(100vw - 32px)" position="68% 50%" priority />}
      />

      <Section labelledBy="scene-title">
        <Grid columns="aside" gap="wide">
          <Eyebrow id="scene-title">この場</Eyebrow>
          <FillText
            variant="prose"
            lines={["ITの会社の、開いた飲み会です。", "会議テーブル、立ち話。窓の外はまだ昼に近い。", "卓は、次の日のデスクと、長いテーブルです。"]}
          />
        </Grid>
      </Section>

      <Section space="md" label="この場での選び方">
        <Grid as="ol" columns="thirds" gap="wide">
          {CRITERIA.map((item) => (
            <Tile key={item.no} no={item.no} title={item.title} titleAs="h2" lines={item.lines} />
          ))}
        </Grid>
      </Section>

      <Section labelledBy="entries-title">
        <SectionHead id="entries-title" eyebrow="一杯" title={<Phrase>この場の一杯</Phrase>} />
        <Stack gap={7} align="stretch">
          <DrinkShowcase label="この場の一杯" drinks={officeEntries().map((drink) => ({ ...drink, label: drink.category }))} />
          <Text variant="body">
            同じカテゴリの残りは、<TextLink href="/drink/">一覧</TextLink>にある。
          </Text>
        </Stack>
      </Section>

      <Section space="md" labelledBy="office-season-title">
        <SectionHead
          id="office-season-title"
          eyebrow="この場の季節"
          glyph={season.label.charAt(0)}
          title={
            <>
              <Phrase>この場の、</Phrase>
              <Phrase>{season.label}</Phrase>
            </>
          }
        >
          <Text variant="lead" tone="secondary">
            {season.line}
          </Text>
        </SectionHead>
        <DrinkShowcase label={season.label} columns={4} drinks={season.drinks.map((drink) => ({ ...drink, label: drink.category }))} />
      </Section>

      <Section width="full" labelledBy="invite-title">
        <MediaPanel media={<Photo name="detail" sizes="100vw" position="30% 50%" />}>
          <Stack gap={4}>
            <Eyebrow>次へ</Eyebrow>
            <Text variant="small" tone="muted">
              美味いブドウのジュースを、卓の中央に置ける。
            </Text>
            <Text as="h2" id="invite-title" variant="headline">
              この空気で、
              <br />
              一杯を決める。
            </Text>
            <JourneyCta to="drink">一杯へ</JourneyCta>
            <ShareRow url={`${SITE_ORIGIN}/ba/office/`} text="オフィスのオープンな飲み会に置く、ノンアル。sunsup" />
          </Stack>
        </MediaPanel>
      </Section>
    </Motion>
  );
}
