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
};

const AXES = [
  {
    no: "01",
    title: "場面",
    lines: ["IT企業の、誰でも参加できる午後の飲み会です。", "家で味を見てから、飲み会に持っていくこともできます。"],
  },
  { no: "02", title: "見た目", lines: ["緑のガラス瓶や小さめの缶など、午後のテーブルに合うラベルです。"] },
  { no: "03", title: "サイズ", lines: ["ひとりで飲み切れる量です。小さめの缶と、分けて飲める瓶があります。"] },
  { no: "04", title: "味", lines: ["果汁、炭酸、冷やして出せるものが中心です。"] },
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
        lead="午後のテーブルに出す1本です。"
        sublead="ラベルより、並べたときの印象で選んでいます。"
      />

      <PeakStage id="peak-title" folio="No. 02" media={<Photo name="peak-wide" narrow="peak" sizes="100vw" priority />}>
        次の飲み会に、
        <br />
        持っていく。
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
          eyebrow="飲み会に持っていく"
          title={
            <>
              <Phrase>次の飲み会に</Phrase>
              <br />
              <Phrase>持っていく1本です。</Phrase>
            </>
          }
          sub={
            <>
              <Phrase>家で冷やしてから、</Phrase>
              <Phrase>テーブルに出します。</Phrase>
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
