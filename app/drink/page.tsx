import type { Metadata } from "next";
import { DrinkShelf, Motion, PageIntro, Phrase, Section, SectionHead } from "@/design-system";
import { drinkGroups } from "@/lib/drinks";

export const metadata: Metadata = {
  title: "一杯の一覧",
  description: "オフィスの卓に置くノンアルを、カテゴリから開く。入口の六杯の先に、残りがある。",
  alternates: { canonical: "/drink/" },
};

export default function DrinkIndexPage() {
  const groups = drinkGroups();

  return (
    <Motion>
      <PageIntro
        id="list-title"
        compact
        eyebrow="一覧"
        title={["一杯の一覧"]}
        lead="場の六杯は入口です。同じカテゴリの残りを、ここから開く。"
      />
      {groups.map((group, index) => (
        <Section key={group.id} space={index === 0 ? "sm" : "md"} labelledBy={`cat-${group.id}`}>
          <SectionHead id={`cat-${group.id}`} compact eyebrow="カテゴリ" title={<Phrase>{group.category}</Phrase>} />
          <DrinkShelf drinks={group.drinks} opening={index === 0} defer={index > 0} />
        </Section>
      ))}
    </Motion>
  );
}
