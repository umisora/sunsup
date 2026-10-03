import type { Metadata } from "next";
import {
  Eyebrow,
  FillText,
  Grid,
  InfoRow,
  JourneyCta,
  MediaPanel,
  Motion,
  PageIntro,
  Photo,
  Phrase,
  Section,
  SectionHead,
  Stack,
  Text,
  TextLink,
  Tile,
} from "@/design-system";
import { officeEntries } from "@/lib/drinks";

export const metadata: Metadata = {
  title: "オフィスのオープンな飲み会",
};

const CRITERIA = [
  {
    no: "01",
    title: "見た目",
    lines: ["卓に置いたとき、場の空気に合うものを選びます。", "緑のガラス。短い缶。ラベルが、午後の卓に馴染むもの。"],
  },
  {
    no: "02",
    title: "サイズ",
    lines: ["一人が、その場で飲み切る量。", "卓で分けられる瓶。短い缶。"],
  },
  {
    no: "03",
    title: "味",
    lines: ["果実、炭酸、苦み。冷たいこと。", "乾杯の気泡は、炭酸の瓶で足ります。"],
  },
] as const;

export default function OfficePage() {
  return (
    <Motion>
      <PageIntro
        id="office-title"
        step="ba"
        folio="No. 01"
        eyebrow="場"
        title={["オフィスの", "オープンな飲み会"]}
        lead="次にデスクが卓になる午後。"
        media={<Photo name="office" sizes="(min-width: 960px) 720px, calc(100vw - 32px)" position="68% 50%" priority />}
      />

      <Section labelledBy="scene-title">
        <Grid columns="aside" gap="wide">
          <Eyebrow id="scene-title">この場</Eyebrow>
          <FillText
            variant="prose"
            lines={["ITの会社の、開いた飲み会です。", "会議テーブル、立ち話。窓の外はまだ昼に近い。", "卓は、次の日のデスクと、長いテーブルです。"]}
          />
        </Grid>
      </Section>

      <Section space="md" label="この場での選び方">
        <Grid as="ol" columns="thirds">
          {CRITERIA.map((item) => (
            <Tile key={item.no} no={item.no} title={item.title} titleAs="h2" lines={item.lines} />
          ))}
        </Grid>
      </Section>

      <Section space="md" labelledBy="entries-title">
        <Stack gap={5}>
          <SectionHead id="entries-title" eyebrow="一杯" title={<Phrase>この場の一杯</Phrase>} />
          <Stack gap={3} align="stretch">
            {officeEntries().map((drink) => (
              <InfoRow key={drink.slug} title={drink.category}>
                <TextLink href={`/drink/${drink.slug}/`}>{drink.name}</TextLink>
              </InfoRow>
            ))}
          </Stack>
          <Text variant="body">
            同じカテゴリの残りは、<TextLink href="/drink/">一覧</TextLink>にある。
          </Text>
        </Stack>
      </Section>

      <Section width="full" labelledBy="invite-title">
        <MediaPanel media={<Photo name="detail" sizes="100vw" position="30% 50%" />}>
          <Stack gap={4}>
            <Eyebrow>次へ</Eyebrow>
            <Text variant="small" tone="muted">
              美味いブドウのジュースを、卓の中央に置ける。
            </Text>
            <Text as="h2" id="invite-title" variant="headline">
              この空気で、
              <br />
              一杯を決める。
            </Text>
            <JourneyCta to="drink">一杯へ</JourneyCta>
          </Stack>
        </MediaPanel>
      </Section>
    </Motion>
  );
}
