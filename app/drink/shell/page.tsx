import type { Metadata } from "next";
import {
  ClosingPanel,
  Grid,
  JourneyCta,
  Motion,
  PageIntro,
  PeakStage,
  Photo,
  Phrase,
  Section,
  StillLife,
  StoreSlot,
  Tile,
} from "@/design-system";

export const metadata: Metadata = {
  title: "この飲み会のドリンク",
  robots: { index: false, follow: true },
};

const AXES = [
  {
    no: "01",
    title: "場面",
    lines: ["お酒を飲まない人も、仕事が残っている人もいる場です。", "家で味を確かめてから、当日のテーブルに出せます。"],
  },
  { no: "02", title: "見た目", lines: ["緑のガラス瓶と小さめの缶なら、会議テーブルでも場違いに見えません。"] },
  { no: "03", title: "サイズ", lines: ["ひとりで飲み切れる量です。", "缶はひとりに一本渡し、瓶はテーブルで分けます。"] },
  { no: "04", title: "味", lines: ["冷やした果汁と炭酸がおすすめです。", "甘いだけだと飽きるので、苦みのある一本も混ぜると安心です。"] },
] as const;

export default function DrinkShellPage() {
  return (
    <Motion>
      <PageIntro
        id="shell-title"
        step="drink"
        compact
        eyebrow="ドリンク"
        title={["この飲み会のドリンク"]}
        lead="定時後のテーブルに出す一本です。"
        sublead="家で冷やしてから持っていくと、当日に慌てません。"
      />

      <PeakStage id="peak-title" folio="No. 02" media={<Photo name="peak-wide" narrow="peak" sizes="100vw" priority />}>
        次の飲み会に
        <br />
        持っていく一本です。
      </PeakStage>

      <Section label="選び方">
        <Grid columns="split">
          <StillLife ratio="4:3" radius="md" parallax>
            <Photo name="office" sizes="(min-width: 960px) 520px, calc(100vw - 32px)" position="78% 50%" decorative />
          </StillLife>
          <Grid as="ol" columns="halves">
            {AXES.map((axis) => (
              <Tile key={axis.no} no={axis.no} title={axis.title} lines={axis.lines} />
            ))}
          </Grid>
        </Grid>
      </Section>

      <Section labelledBy="close-title">
        <ClosingPanel
          id="close-title"
          eyebrow="当日に出す"
          title={
            <>
              <Phrase>次の飲み会に</Phrase>
              <br />
              <Phrase>持っていく一本です。</Phrase>
            </>
          }
          sub={
            <>
              <Phrase>家で冷やしてから持っていくと、</Phrase>
              <Phrase>当日に慌てません。</Phrase>
            </>
          }
          actions={
            <JourneyCta to="ba" direction="back" surface="inverse">
              飲み会に戻る
            </JourneyCta>
          }
        />
        <StoreSlot />
      </Section>
    </Motion>
  );
}
