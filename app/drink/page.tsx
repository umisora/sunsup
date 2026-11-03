import type { Metadata } from "next";
import { CategoryNav, DrinkShelf, Motion, PageIntro, Phrase, Photo, Section, ShelfHead, SITE_NAME, Stack, TableShelf, Text, TextLink, VenueLink } from "@/design-system";
import { categoryHref, drinkGroups } from "@/lib/drinks";
import { SCENES, scenePath } from "@/lib/scenes";
import { jsonLdText, pageJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "ドリンク一覧",
  description: "次の飲み会に持っていく一本を、カテゴリから選べます。",
  alternates: { canonical: "/drink/" },
  openGraph: {
    title: `ドリンク一覧｜${SITE_NAME}`,
    description: "次の飲み会に持っていく一本を、カテゴリから選べます。",
    url: "/drink/",
    siteName: SITE_NAME,
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/og/stylish.jpg", width: 1200, height: 630, alt: `${SITE_NAME} ドリンク一覧` }],
  },
};

export default function DrinkIndexPage() {
  const groups = drinkGroups();
  const categories = groups.map((group) => ({ id: group.id, category: group.category, count: group.drinks.length, href: categoryHref(group.id) }));
  const total = categories.reduce((sum, item) => sum + item.count, 0);

  return (
    <Motion>
      {pageJsonLd("/drink/", "ドリンク一覧").map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(data) }} />
      ))}
      <PageIntro
        id="list-title"
        compact
        eyebrow="ドリンク"
        title={["ドリンク一覧"]}
        lead="次の飲み会に持っていく一本を、カテゴリから選べます。"
        sublead={`全${total}本を、6つのカテゴリに分けています。`}
      />
      <CategoryNav categories={categories} total={total} />
      <Section space="md" label="飲み会">
        <Stack gap={5} align="stretch">
          {[...SCENES].sort((a, b) => (a.slug === "bonenkai" ? -1 : b.slug === "bonenkai" ? 1 : 0)).map((scene) => (
            <VenueLink
              key={scene.slug}
              href={scenePath(scene)}
              media={<Photo name={scene.hero} sizes="(min-width: 768px) 420px, 100vw" position="50% 50%" decorative />}
              eyebrow={scene.eyebrow}
              title={<Phrase>{scene.title}</Phrase>}
              body={scene.backLink}
            />
          ))}
        </Stack>
      </Section>
      <TableShelf known={groups.flatMap((group) => group.drinks.map((drink) => drink.slug))} />
      {groups.map((group, index) => (
        <Section key={group.id} id={group.id} space={index === 0 ? "sm" : "md"} labelledBy={`cat-${group.id}`}>
          <ShelfHead id={`cat-${group.id}`} index={index} title={<Phrase>{group.category}</Phrase>} count={group.drinks.length} />
          <Text variant="body">
            容器ごとに分けた<TextLink href={categoryHref(group.id)}>{group.category}のページ</TextLink>もあります。
          </Text>
          <DrinkShelf drinks={group.drinks} opening={index === 0} defer={index > 0} />
        </Section>
      ))}
    </Motion>
  );
}
