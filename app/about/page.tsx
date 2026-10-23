import type { Metadata } from "next";
import { Eyebrow, Grid, InfoRow, LogoTitle, Motion, Photo, Section, SITE_NAME, Stack, StillLife, Text, TextLink } from "@/design-system";
import { CLARITY_ID } from "../_metrics/Clarity";

export const metadata: Metadata = {
  title: "このサイトについて",
  openGraph: {
    title: `このサイトについて｜${SITE_NAME}`,
    description: "オフィスの飲み会を任されたあなたが、定時後に出すノンアルコールを選ぶサイトです。",
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
              オフィスの飲み会を任されたあなたのためのサイトです。定時後に出すノンアルコールを、場面と見た目、サイズ、味から選べます。
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
            <TextLink href="/ba/office/">オフィスのオープンな飲み会</TextLink>に、定時後何を出すかをまとめています。
          </InfoRow>
          <InfoRow title="ドリンク一覧">
            <TextLink href="/drink/">ドリンク一覧</TextLink>から、カテゴリごとに一本選べます。
          </InfoRow>
          <InfoRow title="購入リンク">
            買うページへのリンクだけ載せています。アフィリエイトではなく、安い順でも並べていません。
          </InfoRow>
          <InfoRow title="アクセスの記録">
            {CLARITY_ID
              ? "どのページが読まれたか、どの購入リンクが押されたかを数えています。名前やメールアドレスなど、あなたが誰かわかる情報は集めていません。数えるのには Cloudflare Web Analytics と、画面のどこが押されたかを見る Microsoft Clarity を使っています。Clarity だけはクッキーを使います。"
              : "どのページが読まれたか、どの購入リンクが押されたかを数えています。クッキーは使わず、名前やメールアドレスなど、あなたが誰かわかる情報は集めていません。数えるのには Cloudflare Web Analytics も使っています。"}
          </InfoRow>
          <InfoRow title="このサイトにないもの" muted>
            カートや会員登録、ランキング、価格比較はありません。
          </InfoRow>
        </Stack>
      </Section>
    </Motion>
  );
}
