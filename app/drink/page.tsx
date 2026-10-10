import type { Metadata } from "next";
import { CategoryNav, DrinkShelf, Motion, PageIntro, Phrase, Section, ShelfHead, TableShelf } from "@/design-system";
import { drinkGroups } from "@/lib/drinks";

export const metadata: Metadata = {
  title: "一杯の一覧",
  description: "オフィスのテーブルに置くノンアルを、カテゴリから探せます。場で紹介した6杯の先に、残りがあります。",
  alternates: { canonical: "/drink/" },
  openGraph: {
    title: "一杯の一覧｜sunsup",
    description: "オフィスのテーブルに置くノンアルを、カテゴリから探せます。場で紹介した6杯の先に、残りがあります。",
    url: "/drink/",
    siteName: "sunsup",
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/og/drink.jpg", width: 1200, height: 630, alt: "sunsup 一杯の一覧" }],
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
        eyebrow="一覧"
        title={["一杯の一覧"]}
        lead="場では6杯だけ紹介しています。同じカテゴリの残りは、ここから開けます。"
        sublead={`全${total}本、6つのカテゴリ`}
      />
      <CategoryNav categories={categories} total={total} />
      <TableShelf />
      {groups.map((group, index) => (
        <Section key={group.id} id={group.id} space={index === 0 ? "sm" : "md"} labelledBy={`cat-${group.id}`}>
          <ShelfHead id={`cat-${group.id}`} index={index} title={<Phrase>{group.category}</Phrase>} count={group.drinks.length} />
          <DrinkShelf drinks={group.drinks} opening={index === 0} defer={index > 0} />
        </Section>
      ))}
    </Motion>
  );
}
