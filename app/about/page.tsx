import type { Metadata } from "next";
import { DisplayLines, Eyebrow, Grid, InfoRow, Motion, Photo, Section, Stack, StillLife, Text, TextLink } from "@/design-system";

export const metadata: Metadata = {
  title: "運営",
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
              次のオフィス飲み会に何を置くかを、場・見た目・サイズ・味から選ぶためのサイトです。
            </Text>
          </Stack>
          <StillLife ratio="3:4" radius="lg">
            <Photo name="peak" sizes="(min-width: 960px) 480px, calc(100vw - 32px)" priority />
          </StillLife>
        </Grid>
      </Section>

      <Section space="md" label="運営について">
        <Stack gap={3} align="stretch">
          <InfoRow title="最初の場">
            <TextLink href="/ba/office/">昼のオフィスのオープンな飲み会</TextLink>。家で届いてから、次の卓へ。
          </InfoRow>
          <InfoRow title="紹介について">
            紹介リンクを置くことがあります。いまは紹介プログラム未参加です。選ぶ軸は価格順にしません。
          </InfoRow>
          <InfoRow title="このサイトにないもの" muted>
            カート、会員、ランキング、安さ比べ。
          </InfoRow>
        </Stack>
      </Section>
    </Motion>
  );
}
