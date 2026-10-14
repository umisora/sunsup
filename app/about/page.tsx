import type { Metadata } from "next";
import { DisplayLines, Eyebrow, Grid, InfoRow, Motion, Photo, Section, Stack, StillLife, Text, TextLink } from "@/design-system";

export const metadata: Metadata = {
  title: "このサイトについて",
  openGraph: {
    title: "このサイトについて｜sunsup",
    description: "オフィスの飲み会に出すノンアルコール飲料を、場面・見た目・サイズ・味から選べるサイトです。",
    url: "/about/",
    siteName: "sunsup",
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/og/about.jpg", width: 1200, height: 630, alt: "sunsup このサイトについて" }],
  },
};

export default function AboutPage() {
  return (
    <Motion>
      <Section space="md" labelledBy="about-title">
        <Grid columns="splitWide" align="center">
          <Stack gap={5}>
            <Eyebrow intro>このサイトについて</Eyebrow>
            <DisplayLines id="about-title" variant="mark" lines={["sunsup"]} />
            <Text variant="lead" intro>
              オフィスの飲み会に出すノンアルコール飲料を、場面・見た目・サイズ・味から選べるサイトです。
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
            <TextLink href="/ba/office/">オフィスのオープンな飲み会</TextLink>で出すドリンクを紹介しています。
          </InfoRow>
          <InfoRow title="ドリンク一覧">
            <TextLink href="/drink/">ドリンク一覧</TextLink>では、ノンアルコール飲料をカテゴリ別に並べています。
          </InfoRow>
          <InfoRow title="購入リンク">
            商品ページへのリンクを載せています。アフィリエイトには参加しておらず、価格の安い順でも並べていません。
          </InfoRow>
          <InfoRow title="このサイトにないもの" muted>
            カート、会員登録、ランキング、価格比較。
          </InfoRow>
        </Stack>
      </Section>
    </Motion>
  );
}
