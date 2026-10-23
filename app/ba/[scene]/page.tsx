import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DrinkShowcase,
  Eyebrow,
  FillText,
  Grid,
  JourneyCta,
  MediaPanel,
  Motion,
  PageIntro,
  Photo,
  Phrase,
  Section,
  SectionHead,
  ShareRow,
  SITE_NAME,
  Stack,
  Text,
  TextLink,
  Tile,
} from "@/design-system";
import { SITE_ORIGIN } from "@/lib/drinks";
import { jsonLdText } from "@/lib/jsonld";
import { getScene, groupDrinks, sceneHero, sceneJsonLd, scenePath, SCENES } from "@/lib/scenes";

type ScenePageProps = {
  params: Promise<{ scene: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return SCENES.map((scene) => ({ scene: scene.slug }));
}

export async function generateMetadata({ params }: ScenePageProps): Promise<Metadata> {
  const scene = getScene((await params).scene);
  if (!scene) {
    return { title: "このページはありません" };
  }
  const path = scenePath(scene);
  return {
    title: scene.title,
    description: scene.description,
    alternates: { canonical: path },
    openGraph: {
      title: `${scene.title}｜${SITE_NAME}`,
      description: scene.description,
      url: path,
      siteName: SITE_NAME,
      locale: "ja_JP",
      type: "article",
      images: [{ url: "/og/stylish.jpg", width: 1200, height: 630, alt: `${SITE_NAME} ${scene.title}` }],
    },
  };
}

export default async function ScenePage({ params }: ScenePageProps) {
  const scene = getScene((await params).scene);
  if (!scene) {
    notFound();
  }
  const [lineA, lineB] = scene.title.split("の");

  return (
    <Motion>
      {sceneJsonLd(scene).map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(data) }} />
      ))}
      <PageIntro
        id="scene-intro-title"
        step="ba"
        eyebrow="飲み会"
        title={lineB ? [`${lineA}の`, lineB] : [scene.title]}
        lead={scene.lead}
        media={<Photo name={sceneHero(scene)} sizes="(min-width: 960px) 720px, calc(100vw - 32px)" position="50% 50%" priority />}
      />

      <Section labelledBy="scene-title">
        <Grid columns="aside" gap="wide">
          <Eyebrow id="scene-title">この飲み会</Eyebrow>
          <FillText variant="prose" lines={[scene.prose]} />
        </Grid>
      </Section>

      <Section space="md" label="選び方">
        <Grid as="ol" columns="thirds" gap="wide">
          {scene.criteria.map((item) => (
            <Tile key={item.no} no={item.no} title={item.title} titleAs="h2" lines={item.lines} />
          ))}
        </Grid>
      </Section>

      {scene.groups.map((group) => {
        const drinks = groupDrinks(group);
        if (drinks.length === 0) {
          return null;
        }
        return (
          <Section key={group.id} space="md" labelledBy={`group-${group.id}`}>
            <SectionHead id={`group-${group.id}`} eyebrow={scene.short} title={<Phrase>{group.title}</Phrase>}>
              <Text variant="lead" tone="secondary">
                {group.line}
              </Text>
            </SectionHead>
            <DrinkShowcase label={group.title} columns={4} drinks={drinks.map((drink) => ({ ...drink, label: drink.category }))} />
          </Section>
        );
      })}

      <Section space="md" label="ほかの飲み会">
        <Text variant="body">
          ほかのドリンクは<TextLink href="/drink/">ドリンク一覧</TextLink>に、定時後の社内の飲み会は
          <TextLink href="/ba/office/">オフィスのオープンな飲み会</TextLink>にあります。
        </Text>
      </Section>

      <Section width="full" labelledBy="scene-invite-title">
        <MediaPanel media={<Photo name="detail" sizes="100vw" position="30% 50%" />}>
          <Stack gap={4}>
            <Eyebrow>ドリンクを選ぶ</Eyebrow>
            <Text variant="small" tone="muted">
              人数と、お酒を飲まない人の数がわかったら、本数を決めます。
            </Text>
            <Text as="h2" id="scene-invite-title" variant="headline">
              大きな瓶を一本と、
              <br />
              小さな瓶を人数分。
            </Text>
            <JourneyCta to="drink">ドリンクを見る</JourneyCta>
            <ShareRow url={`${SITE_ORIGIN}${scenePath(scene)}`} text={`${scene.title}｜${SITE_NAME}`} />
          </Stack>
        </MediaPanel>
      </Section>
    </Motion>
  );
}
