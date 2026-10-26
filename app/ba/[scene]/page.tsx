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
  ShoppingList,
  ShoppingListCta,
  SITE_NAME,
  Stack,
  Text,
  TextLink,
  Tile,
} from "@/design-system";
import { categoryHref, categoryId, categorySummaries, SITE_ORIGIN } from "@/lib/drinks";
import { jsonLdText } from "@/lib/jsonld";
import { getScene, groupDrinks, sceneDrinks, sceneJsonLd, sceneSet, scenePath, SCENES } from "@/lib/scenes";

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
  // Break after the last の: 「会社の飲み会の」「ノンアルコール」
  const cut = scene.title.lastIndexOf("の") + 1;
  const titleLines = scene.titleLines ? [...scene.titleLines] : cut > 0 && cut < scene.title.length ? [scene.title.slice(0, cut), scene.title.slice(cut)] : [scene.title];

  // Categories of this page's drinks that have their own page.
  const used = new Set(sceneDrinks(scene).map(categoryId));
  const categoryPages = categorySummaries().filter((item) => used.has(item.id));
  const list = sceneSet(scene);
  const hasList = list.cards.some((card) => card.items.length > 0);

  return (
    <Motion>
      {sceneJsonLd(scene).map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(data) }} />
      ))}
      <PageIntro
        id="scene-intro-title"
        step="ba"
        eyebrow={scene.eyebrow}
        title={titleLines}
        lead={scene.lead}
        media={<Photo name={scene.hero} sizes="(min-width: 960px) 720px, calc(100vw - 32px)" position="50% 50%" priority />}
      />

      <Section labelledBy="scene-title">
        <Grid columns="aside" gap="wide">
          <Eyebrow id="scene-title">{scene.proseLabel}</Eyebrow>
          <Stack gap={3}>
            <FillText variant="prose" lines={[scene.prose]} />
            {hasList ? <ShoppingListCta /> : null}
          </Stack>
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

      {hasList ? (
        <Section id="list" space="md" labelledBy="list-title">
          <ShoppingList headingId="list-title" title={list.title} cards={list.cards} url={`${SITE_ORIGIN}${scenePath(scene)}`} />
        </Section>
      ) : null}

      <Section space="md" label="ほかの場面">
        <Stack gap={3}>
          <Text variant="body">
            ほかのドリンクは<TextLink href="/drink/">ドリンク一覧</TextLink>に、定時後の社内の飲み会は
            <TextLink href="/ba/office/">オフィスのオープンな飲み会</TextLink>にあります。
          </Text>
          <Text variant="body">
            ほかの場面は、
            {SCENES.filter((other) => other.slug !== scene.slug).map((other, index, list) => (
              <span key={other.slug}>
                <TextLink href={scenePath(other)}>{other.title}</TextLink>
                {index < list.length - 1 ? "、" : ""}
              </span>
            ))}
            です。
          </Text>
          {categoryPages.length > 0 ? (
            <Text variant="body">
              種類で選ぶなら、
              {categoryPages.map((item, index) => (
                <span key={item.id}>
                  <TextLink href={categoryHref(item.id)}>{item.category}</TextLink>
                  {index < categoryPages.length - 1 ? "、" : ""}
                </span>
              ))}
              のページもあります。
            </Text>
          ) : null}
        </Stack>
      </Section>

      <Section width="full" labelledBy="scene-invite-title">
        <MediaPanel media={<Photo name="detail" sizes="100vw" position="30% 50%" />}>
          <Stack gap={4}>
            <Eyebrow>ドリンクを選ぶ</Eyebrow>
            <Text variant="small" tone="muted">
              {scene.invite.note}
            </Text>
            <Text as="h2" id="scene-invite-title" variant="headline">
              {scene.invite.headline[0]}
              <br />
              {scene.invite.headline[1]}
            </Text>
            <JourneyCta to="drink">ドリンクを見る</JourneyCta>
            <ShareRow url={`${SITE_ORIGIN}${scenePath(scene)}`} text={`${scene.title}｜${SITE_NAME}`} />
          </Stack>
        </MediaPanel>
      </Section>
    </Motion>
  );
}
