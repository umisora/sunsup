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
  alternates: { canonical: "/ba/office/" },
  description: "定時後のオフィスで、会議室のテーブルを囲む立ち飲みです。お酒を飲まない人にも渡せる缶と瓶を紹介しています。",
  openGraph: {
    title: `オフィスのオープンな飲み会｜${SITE_NAME}`,
    description: "定時後のオフィスで、会議室のテーブルを囲む立ち飲みです。お酒を飲まない人にも渡せる缶と瓶を紹介しています。",
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
    lines: ["会議テーブルに置くなら、緑のガラス瓶か小さめの缶です。", "仕事の画面の横に置いても、場違いに見えません。"],
  },
  {
    no: "02",
    title: "サイズ",
    lines: ["立ち飲みなので、ひとりで飲み切れる量です。", "缶はひとりに一本渡し、瓶はテーブルで分けます。"],
  },
  {
    no: "03",
    title: "味",
    lines: ["冷やした果汁と炭酸がおすすめです。", "甘いだけだと飽きる人のために、苦みのある一本も混ぜると安心です。"],
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
        lead="飲み会を任されたあなたが、定時後に出すドリンクのページです。"
        media={<Photo name="office" sizes="(min-width: 960px) 720px, calc(100vw - 32px)" position="68% 50%" priority />}
      />

      <Section labelledBy="scene-title">
        <Grid columns="aside" gap="wide">
          <Eyebrow id="scene-title">この飲み会</Eyebrow>
          <FillText
            variant="prose"
            lines={[
              "定時後のオフィスで、会議室のテーブルを囲んで立ち飲み。お酒を飲まない人も、まだ仕事が残っている人もいる場です。片手で持てる缶や小ぶりの瓶を中心に、少しだけ特別な一本を混ぜると盛り上がります。",
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
          <Text variant="body">
            お店で開く会社の飲み会は<TextLink href="/ba/kaisha/">会社の飲み会のノンアルコール</TextLink>に、年末と年始の飲み会は
            <TextLink href="/ba/bonenkai/">忘年会・新年会のノンアルコール</TextLink>に、春の歓迎会と送別会は
            <TextLink href="/ba/kansougeikai/">歓送迎会のノンアルコール</TextLink>にまとめています。
          </Text>
          <Text variant="body">
            飲み会のほかに、<TextLink href="/ba/sashiire/">差し入れ・手土産</TextLink>と
            <TextLink href="/ba/nomanai-hito/">お酒を飲まない人に渡す一本</TextLink>のページもあります。
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
              真ん中にぶどうの瓶を一本置くと、話のきっかけになります。
            </Text>
            <Text as="h2" id="invite-title" variant="headline">
              特別な一本を
              <br />
              混ぜると盛り上がります。
            </Text>
            <JourneyCta to="drink">ドリンクを見る</JourneyCta>
            <ShareRow url={`${SITE_ORIGIN}/ba/office/`} text={`オフィスの飲み会向けノンアルコール飲料です。${SITE_NAME}`} />
          </Stack>
        </MediaPanel>
      </Section>
    </Motion>
  );
}
