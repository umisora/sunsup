import type { Metadata } from "next";
import { CategoryNav, DrinkShelf, Motion, PageIntro, Phrase, Section, ShelfHead, SITE_NAME, TableShelf } from "@/design-system";
import { drinkGroups } from "@/lib/drinks";

export const metadata: Metadata = {
  title: "ドリンク一覧",
  description: "オフィスの飲み会に持っていくノンアルコール飲料を、カテゴリから探せます。",
  alternates: { canonical: "/drink/" },
  openGraph: {
    title: `ドリンク一覧｜${SITE_NAME}`,
    description: "オフィスの飲み会に持っていくノンアルコール飲料を、カテゴリから探せます。",
    url: "/drink/",
    siteName: SITE_NAME,
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/og/stylish.jpg", width: 1200, height: 630, alt: `${SITE_NAME} ドリンク一覧` }],
  },
};

export default function DrinkIndexPage() {
  const groups = drinkGroups();
  const categories = groups.map((group) => ({ id: group.id, category: group.category, count: group.drinks.length }));
  const total = categories.reduce((sum, item) => sum + item.count, 0);

  return (
    <Motion>
      <PageIntro
        id="list-title"
        compact
        eyebrow="ドリンク"
        title={["ドリンク一覧"]}
        lead="オフィスの飲み会に持っていくノンアルコール飲料を、カテゴリから探せます。"
        sublead={`全${total}本を、6つのカテゴリに分けています。`}
      />
      <CategoryNav categories={categories} total={total} />
      <TableShelf known={groups.flatMap((group) => group.drinks.map((drink) => drink.slug))} />
      {groups.map((group, index) => (
        <Section key={group.id} id={group.id} space={index === 0 ? "sm" : "md"} labelledBy={`cat-${group.id}`}>
          <ShelfHead id={`cat-${group.id}`} index={index} title={<Phrase>{group.category}</Phrase>} count={group.drinks.length} />
          <DrinkShelf drinks={group.drinks} opening={index === 0} defer={index > 0} />
        </Section>
      ))}
    </Motion>
  );
}
