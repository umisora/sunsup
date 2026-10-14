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
  SITE_NAME,
  Stack,
  Text,
  TextLink,
  Tile,
} from "@/design-system";
import { officeEntries, seasonalPicks, seasonOf, SITE_ORIGIN } from "@/lib/drinks";

export const metadata: Metadata = {
  title: "オフィスのオープンな飲み会",
  description: "IT企業の誰でも参加できる飲み会です。翌日も使うデスクで、缶と瓶のノンアルコール飲料を飲みます。",
  openGraph: {
    title: `オフィスのオープンな飲み会｜${SITE_NAME}`,
    description: "IT企業の誰でも参加できる飲み会です。翌日も使うデスクで、缶と瓶のノンアルコール飲料を飲みます。",
    url: "/ba/office/",
    siteName: SITE_NAME,
    locale: "ja_JP",
    type: "article",
    images: [{ url: "/og/stylish.jpg", width: 1200, height: 630, alt: `${SITE_NAME} オフィスのオープンな飲み会` }],
  },
};

const CRITERIA = [
  {
    no: "01",
    title: "見た目",
    lines: ["緑のガラス瓶と小さめの缶は、午後の明るいテーブルに合います。", "ラベルも、その時間の部屋に合っています。"],
  },
  {
    no: "02",
    title: "サイズ",
    lines: ["立ち話のあいだに、ひとりで飲み切れる量です。", "分けて回せる瓶と、小さめの缶があります。"],
  },
  {
    no: "03",
    title: "味",
    lines: ["果汁と炭酸、それに苦みがあります。", "冷やして出せるので、昼に近い時間でも飲めます。"],
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
        eyebrow="飲み会"
        title={["オフィスの", "オープンな飲み会"]}
        lead="デスクのまわりで、誰でも参加できる午後の飲み会です。"
        media={<Photo name="office" sizes="(min-width: 960px) 720px, calc(100vw - 32px)" position="68% 50%" priority />}
      />

      <Section labelledBy="scene-title">
        <Grid columns="aside" gap="wide">
          <Eyebrow id="scene-title">この飲み会</Eyebrow>
          <FillText
            variant="prose"
            lines={[
              "IT企業で、誰でも参加できる飲み会です。終わった会議のテーブルのまわりで、立ち話をします。窓の外はまだ昼に近い時間です。翌日も使うデスクと長いテーブルが、そのまま場所になります。",
              "立ち話には、持ったまま飲める缶と、分けられる瓶が向いています。",
            ]}
          />
        </Grid>
      </Section>

      <Section space="md" label="選び方">
        <Grid as="ol" columns="thirds" gap="wide">
          {CRITERIA.map((item) => (
            <Tile key={item.no} no={item.no} title={item.title} titleAs="h2" lines={item.lines} />
          ))}
        </Grid>
      </Section>

      <Section labelledBy="entries-title">
        <SectionHead id="entries-title" eyebrow="ドリンク" title={<Phrase>この飲み会のドリンク</Phrase>} />
        <Stack gap={7} align="stretch">
          <DrinkShowcase label="この飲み会のドリンク" drinks={officeEntries().map((drink) => ({ ...drink, label: drink.category }))} />
          <Text variant="body">
            同じカテゴリの他の商品は、<TextLink href="/drink/">ドリンク一覧</TextLink>にあります。
          </Text>
        </Stack>
      </Section>

      <Section space="md" labelledBy="office-season-title">
        <SectionHead
          id="office-season-title"
          eyebrow="季節のおすすめ"
          glyph={season.label.charAt(0)}
          title={
            <>
              <Phrase>この飲み会の</Phrase>
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
            <Eyebrow>ドリンクを選ぶ</Eyebrow>
            <Text variant="small" tone="muted">
              長いテーブルの真ん中には、ぶどうジュースを置けます。
            </Text>
            <Text as="h2" id="invite-title" variant="headline">
              この時間の席に
              <br />
              合うドリンクです。
            </Text>
            <JourneyCta to="drink">ドリンクを見る</JourneyCta>
            <ShareRow url={`${SITE_ORIGIN}/ba/office/`} text={`オフィスの飲み会向けノンアルコール飲料です。${SITE_NAME}`} />
          </Stack>
        </MediaPanel>
      </Section>
    </Motion>
  );
}
