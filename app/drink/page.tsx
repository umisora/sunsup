import type { Metadata } from "next";
import { CategoryNav, DrinkShelf, Motion, PageIntro, Phrase, Section, ShelfHead, TableShelf } from "@/design-system";
import { drinkGroups } from "@/lib/drinks";

export const metadata: Metadata = {
  title: "一杯の一覧",
  description: "オフィスの卓に置くノンアルを、カテゴリから開く。入口の六杯の先に、残りがある。",
  alternates: { canonical: "/drink/" },
  openGraph: {
    title: "一杯の一覧｜sunsup",
    description: "オフィスの卓に置くノンアルを、カテゴリから開く。入口の六杯の先に、残りがある。",
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
        lead="場の六杯は入口です。同じカテゴリの残りを、ここから開く。"
        sublead={`全${total}本・六つのカテゴリ`}
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
