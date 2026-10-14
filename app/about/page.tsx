import type { Metadata } from "next";
import { Eyebrow, Grid, InfoRow, LogoTitle, Motion, Photo, Section, SITE_NAME, Stack, StillLife, Text, TextLink } from "@/design-system";

export const metadata: Metadata = {
  title: "このサイトについて",
  openGraph: {
    title: `このサイトについて｜${SITE_NAME}`,
    description: "オフィスの飲み会に持っていくノンアルコール飲料を、場面と見た目、サイズ、味から紹介するサイトです。",
    url: "/about/",
    siteName: SITE_NAME,
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/og/stylish.jpg", width: 1200, height: 630, alt: `${SITE_NAME} このサイトについて` }],
  },
};

export default function AboutPage() {
  return (
    <Motion>
      <Section space="md" labelledBy="about-title">
        <Grid columns="splitWide" align="center">
          <Stack gap={5}>
            <Eyebrow intro>このサイトについて</Eyebrow>
            <LogoTitle id="about-title" />
            <Text variant="lead" intro>
              オフィスの飲み会に持っていくノンアルコール飲料を紹介しています。場面、見た目、サイズ、味から探せます。
            </Text>
          </Stack>
          <StillLife ratio="3:4" radius="lg">
            <Photo name="peak" sizes="(min-width: 960px) 480px, calc(100vw - 32px)" priority />
          </StillLife>
        </Grid>
      </Section>

      <Section space="md" label="サイトの内容">
        <Stack gap={0} align="stretch">
          <InfoRow title="オフィスの飲み会">
            <TextLink href="/ba/office/">オフィスのオープンな飲み会</TextLink>に持っていくドリンクを紹介しています。
          </InfoRow>
          <InfoRow title="ドリンク一覧">
            <TextLink href="/drink/">ドリンク一覧</TextLink>では、ノンアルコール飲料をカテゴリ別に並べています。
          </InfoRow>
          <InfoRow title="購入リンク">
            商品ページへのリンクを載せています。アフィリエイトには参加しておらず、価格の安い順でも並べていません。
          </InfoRow>
          <InfoRow title="このサイトにないもの" muted>
            カートや会員登録、ランキング、価格比較はありません。
          </InfoRow>
        </Stack>
      </Section>
    </Motion>
  );
}
