import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Button,
  ClosingPanel,
  DrinkShowcase,
  ExternalPhoto,
  FactList,
  Motion,
  Phrase,
  ProductHero,
  Section,
  SectionHead,
  Stack,
  StillLife,
  StoreDock,
  StoreSlot,
  storeAction,
} from "@/design-system";
import {
  categoryId,
  drinkDescription,
  drinkTitle,
  getDrink,
  loadDrinks,
  relatedDrinks,
  shareImage,
  storeRows,
} from "@/lib/drinks";

type DrinkPageProps = {
  params: Promise<{ slug: string }>;
};

const AXES = [
  { key: "place", no: "01", title: "場" },
  { key: "look", no: "02", title: "見た目" },
  { key: "size", no: "03", title: "サイズ" },
  { key: "taste", no: "04", title: "味" },
] as const;

const RELATED_SHOWN = 8;

export const dynamicParams = false;

export function generateStaticParams() {
  return loadDrinks().map((drink) => ({ slug: drink.slug }));
}

export async function generateMetadata({ params }: DrinkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const drink = getDrink(slug);
  if (!drink) {
    return { title: "このページはありません" };
  }
  const title = drinkTitle(drink);
  const description = drinkDescription(drink);
  const image = shareImage(drink);
  return {
    title,
    description,
    alternates: { canonical: `/drink/${drink.slug}/` },
    openGraph: {
      title: `${title}｜sunsup`,
      description,
      url: `/drink/${drink.slug}/`,
      siteName: "sunsup",
      locale: "ja_JP",
      type: "article",
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function DrinkPage({ params }: DrinkPageProps) {
  const { slug } = await params;
  const drink = getDrink(slug);
  if (!drink) {
    notFound();
  }

  const rows = storeRows(drink);
  const [primary] = rows;
  const related = relatedDrinks(drink);
  const shelf = `/drink/#${categoryId(drink)}`;

  return (
    <Motion>
      <ProductHero
        id="drink-title"
        crumbs={[
          { href: "/drink/", label: "一覧" },
          { href: shelf, label: drink.category },
        ]}
        title={drink.name}
        meta={drink.size}
        media={
          drink.stillUrl ? (
            <StillLife ratio="1:1" radius="lg" fit="plinth" intro>
              <ExternalPhoto src={drink.stillUrl} alt={drink.name} priority />
            </StillLife>
          ) : undefined
        }
      >
        {rows.length > 0 ? <StoreSlot rows={rows} /> : null}
      </ProductHero>

      <Section space="md" label="この一杯">
        <FactList
          label="この一杯"
          facts={AXES.map((axis) => ({ key: axis.key, no: axis.no, title: axis.title, body: drink[axis.key] }))}
        />
      </Section>

      <Section space="md" labelledBy="close-title">
        <div data-dock-cover>
          <ClosingPanel
            id="close-title"
            eyebrow="次の飲み会"
            title={
              <>
                <Phrase>次の飲み会に、</Phrase>
                <Phrase>これを置く。</Phrase>
              </>
            }
            sub={drink.name}
            actions={
              primary ? (
                <Button variant="inverse" icon="external" href={primary.href}>
                  {storeAction(primary)}
                </Button>
              ) : null
            }
          />
        </div>
      </Section>

      {related.length > 0 ? (
        <Section space="md" labelledBy="related-title">
          <SectionHead id="related-title" eyebrow={drink.category} title={<Phrase>同じカテゴリの一杯</Phrase>} />
          <Stack gap={7} align="stretch">
            <DrinkShowcase label="同じカテゴリ" columns={4} drinks={related.slice(0, RELATED_SHOWN)} />
            <div>
              <Button variant="secondary" href={shelf}>
                {drink.category}をすべて見る（{related.length + 1}本）
              </Button>
            </div>
          </Stack>
        </Section>
      ) : null}

      {primary ? <StoreDock name={drink.name} href={primary.href} action={storeAction(primary)} anchorId="store-row" /> : null}
    </Motion>
  );
}
