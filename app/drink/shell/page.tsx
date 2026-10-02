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
  title: "この卓の一杯",
};

const AXES = [
  {
    no: "01",
    title: "場",
    lines: ["次にデスクが卓になる午後。ITの会社の、開いた飲み会。", "家で試してから、次の卓へ。"],
  },
  { no: "02", title: "見た目", lines: ["緑のガラス。短い缶。午後の卓に馴染むラベル。"] },
  { no: "03", title: "サイズ", lines: ["一人が飲み切る量。短い缶。分けられる瓶。"] },
  { no: "04", title: "味", lines: ["果実、炭酸、冷たいこと。", "乾杯の気泡は、炭酸の瓶で足る。"] },
] as const;

export default function DrinkShellPage() {
  return (
    <Motion>
      <PageIntro
        id="shell-title"
        step="drink"
        compact
        eyebrow="一杯"
        title={["この卓の一杯"]}
        lead="午後の卓の、一本。"
        sublead="ラベルより先に、置いたときの空気で選ぶ。"
      />

      <PeakStage id="peak-title" folio="No. 02" media={<Photo name="peak-wide" narrow="peak" sizes="100vw" priority />}>
        次の飲み会に、
        <br />
        これを置く。
      </PeakStage>

      <Section label="この一杯の選び方">
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
          eyebrow="次の飲み会"
          title={
            <>
              <Phrase>次回これにしよ、</Phrase>
              <br />
              <Phrase>が立てばいい。</Phrase>
            </>
          }
          sub={
            <>
              <Phrase>家で冷えてから、</Phrase>
              <Phrase>次の卓の中央へ。</Phrase>
            </>
          }
          actions={
            <JourneyCta to="ba" direction="back" surface="inverse">
              場へ戻る
            </JourneyCta>
          }
        />
        <StoreSlot />
      </Section>
    </Motion>
  );
}
