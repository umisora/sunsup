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
  description: "デスクのまわりで気軽に集まる、誰でも参加できる飲み会です。出すノンアルコール飲料を紹介しています。",
  openGraph: {
    title: "オフィスのオープンな飲み会｜sunsup",
    description: "デスクのまわりで気軽に集まる、誰でも参加できる飲み会です。出すノンアルコール飲料を紹介しています。",
    url: "/ba/office/",
    siteName: "sunsup",
    locale: "ja_JP",
    type: "article",
    images: [{ url: "/og/office.jpg", width: 1200, height: 630, alt: "sunsup オフィスのオープンな飲み会" }],
  },
};

const CRITERIA = [
  {
    no: "01",
    title: "見た目",
    lines: ["テーブルに並べて、雰囲気に合うものを選んでいます。", "緑のガラス瓶や小さめの缶です。ラベルは午後のテーブルに合います。"],
  },
  {
    no: "02",
    title: "サイズ",
    lines: ["ひとりで飲み切れる量です。", "分けて飲める瓶と小さめの缶があります。"],
  },
  {
    no: "03",
    title: "味",
    lines: ["果汁、炭酸、苦みがあります。", "冷やして出せるものが中心です。"],
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
        lead="デスクのまわりで気軽に集まる午後です。"
        media={<Photo name="office" sizes="(min-width: 960px) 720px, calc(100vw - 32px)" position="68% 50%" priority />}
      />

      <Section labelledBy="scene-title">
        <Grid columns="aside" gap="wide">
          <Eyebrow id="scene-title">この飲み会</Eyebrow>
          <FillText
            variant="prose"
            lines={["IT企業の誰でも参加できる飲み会です。", "会議テーブルのまわりで立ち話をします。窓の外はまだ昼に近いです。", "翌日のデスクと長いテーブルが場所になります。"]}
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
              おいしいぶどうジュースをテーブルの真ん中に置けます。
            </Text>
            <Text as="h2" id="invite-title" variant="headline">
              この飲み会に合う
              <br />
              ドリンクを選ぶ。
            </Text>
            <JourneyCta to="drink">ドリンクを見る</JourneyCta>
            <ShareRow url={`${SITE_ORIGIN}/ba/office/`} text="オフィスの飲み会向けノンアルコール飲料です。sunsup" />
          </Stack>
        </MediaPanel>
      </Section>
    </Motion>
  );
}
