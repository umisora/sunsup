import type { Metadata } from "next";
import { DisplayLines, Eyebrow, Grid, InfoRow, Motion, Photo, Section, Stack, StillLife, Text, TextLink } from "@/design-system";

export const metadata: Metadata = {
  title: "運営",
  openGraph: {
    title: "運営｜sunsup",
    description: "次のオフィス飲み会に何を置くかを、場・見た目・サイズ・味から選ぶサイトです。",
    url: "/about/",
    siteName: "sunsup",
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/og/about.jpg", width: 1200, height: 630, alt: "sunsup 運営" }],
  },
};

export default function AboutPage() {
  return (
    <Motion>
      <Section space="md" labelledBy="about-title">
        <Grid columns="splitWide" align="center">
          <Stack gap={5}>
            <Eyebrow intro>運営</Eyebrow>
            <DisplayLines id="about-title" variant="mark" lines={["sunsup"]} />
            <Text variant="lead" intro>
              次のオフィス飲み会に何を置くかを、場・見た目・サイズ・味から選ぶサイトです。
            </Text>
          </Stack>
          <StillLife ratio="3:4" radius="lg">
            <Photo name="peak" sizes="(min-width: 960px) 480px, calc(100vw - 32px)" priority />
          </StillLife>
        </Grid>
      </Section>

      <Section space="md" label="運営について">
        <Stack gap={0} align="stretch">
          <InfoRow title="最初の場">
            <TextLink href="/ba/office/">オフィスのオープンな飲み会</TextLink>。届いてから、次の場へ。
          </InfoRow>
          <InfoRow title="一杯の一覧">
            <TextLink href="/drink/">カテゴリごとの残り</TextLink>。場で紹介した6杯の先。
          </InfoRow>
          <InfoRow title="紹介について">
            購入先のリンクを置くことがあります。いまは紹介プログラムには入っていません。安さ順では並べません。
          </InfoRow>
          <InfoRow title="このサイトにないもの" muted>
            カート、会員登録、ランキング、安さ比べ。
          </InfoRow>
        </Stack>
      </Section>
    </Motion>
  );
}
