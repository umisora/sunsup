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
    lines: ["IT企業の誰でも参加できる午後の飲み会です。", "家で一度飲んでから、当日のテーブルに出せます。"],
  },
  { no: "02", title: "見た目", lines: ["緑のガラス瓶と小さめの缶です。", "午後のテーブルの雰囲気に合います。"] },
  { no: "03", title: "サイズ", lines: ["ひとりで飲み切れる量です。", "缶は持ったまま飲めて、瓶は分けて飲めます。"] },
  { no: "04", title: "味", lines: ["果汁と炭酸が中心です。", "冷やして、午後の席に出せます。"] },
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
        sublead="家で冷やしてから、飲み会に持っていけます。"
      />

      <PeakStage id="peak-title" folio="No. 02" media={<Photo name="peak-wide" narrow="peak" sizes="100vw" priority />}>
        次の飲み会に
        <br />
        持っていけます。
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
              <Phrase>持っていける1本です。</Phrase>
            </>
          }
          sub={
            <>
              <Phrase>家で冷やしてから、</Phrase>
              <Phrase>テーブルに出せます。</Phrase>
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
