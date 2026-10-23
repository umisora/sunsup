import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DrinkShelf,
  Eyebrow,
  FillText,
  Grid,
  Motion,
  PageIntro,
  Photo,
  Phrase,
  Section,
  SectionHead,
  ShareRow,
  SITE_NAME,
  Stack,
  TableShelf,
  Text,
  TextLink,
} from "@/design-system";
import {
  CATEGORY_PAGES,
  categoryDescription,
  categoryDrinks,
  categoryJsonLd,
  categoryPagePath,
  categoryScenes,
  getCategoryPage,
  vesselGroups,
} from "@/lib/categories";
import { categorySummaries, SITE_ORIGIN } from "@/lib/drinks";
import { jsonLdText } from "@/lib/jsonld";
import { scenePath } from "@/lib/scenes";

type CategoryPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORY_PAGES.map((page) => ({ id: page.id }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const page = getCategoryPage((await params).id);
  if (!page) {
    return { title: "このページはありません" };
  }
  const path = categoryPagePath(page);
  const description = categoryDescription(page, categoryDrinks(page).drinks);
  return {
    title: page.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${page.title}｜${SITE_NAME}`,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "ja_JP",
      type: "website",
      images: [{ url: "/og/stylish.jpg", width: 1200, height: 630, alt: `${SITE_NAME} ${page.title}` }],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const page = getCategoryPage((await params).id);
  if (!page) {
    notFound();
  }
  const { category, drinks } = categoryDrinks(page);
  const groups = vesselGroups(drinks);
  const scenes = categoryScenes(drinks);
  const others = categorySummaries().filter((item) => item.id !== page.id);

  return (
    <Motion>
      {categoryJsonLd(page, drinks).map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(data) }} />
      ))}
      <PageIntro
        id="category-intro-title"
        step="drink"
        eyebrow="カテゴリ"
        title={page.titleLines}
        lead={page.lead}
        sublead={`全${drinks.length}本。${groups.map((group) => `${group.short}${group.drinks.length}本`).join("、")}です。`}
        media={<Photo name={page.hero} sizes="(min-width: 960px) 720px, calc(100vw - 32px)" position="50% 50%" priority />}
      />

      <Section labelledBy="category-title">
        <Grid columns="aside" gap="wide">
          <Eyebrow id="category-title">{category}</Eyebrow>
          <FillText variant="prose" lines={[page.prose]} />
        </Grid>
      </Section>

      <TableShelf known={drinks.map((drink) => drink.slug)} />

      {groups.map((group, index) => (
        <Section key={group.id} id={group.id} space="md" labelledBy={`vessel-${group.id}`}>
          <SectionHead id={`vessel-${group.id}`} eyebrow={category} title={<Phrase>{group.title}</Phrase>}>
            <Text variant="lead" tone="secondary">
              {group.line}
            </Text>
          </SectionHead>
          <DrinkShelf drinks={group.drinks} opening={index === 0} defer={index > 0} />
        </Section>
      ))}

      <Section space="md" label="ほかの選び方">
        <Stack gap={3}>
          {scenes.length > 0 ? (
            <Text variant="body">
              場面で選ぶなら、
              {scenes.map(({ scene, count }, index) => (
                <span key={scene.slug}>
                  <TextLink href={scenePath(scene)}>{scene.title}</TextLink>（このカテゴリから{count}本）
                  {index < scenes.length - 1 ? "、" : ""}
                </span>
              ))}
              のページがあります。
            </Text>
          ) : null}
          <Text variant="body">
            ほかのカテゴリは、
            {others.map((item, index) => (
              <span key={item.id}>
                <TextLink href={item.href}>{item.category}</TextLink>
                {index < others.length - 1 ? "、" : ""}
              </span>
            ))}
            です。すべてのドリンクは<TextLink href="/drink/">ドリンク一覧</TextLink>にあります。
          </Text>
          <ShareRow url={`${SITE_ORIGIN}${categoryPagePath(page)}`} text={`${page.title}｜${SITE_NAME}`} />
        </Stack>
      </Section>
    </Motion>
  );
}
