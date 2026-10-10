import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Button,
  DrinkShowcase,
  DrinkTrail,
  ExternalPhoto,
  FactList,
  Motion,
  Photo,
  Phrase,
  ProductHero,
  Section,
  SectionHead,
  ShareRow,
  Stack,
  StillLife,
  StoreDock,
  StoreSlot,
  storeAction,
  TableCard,
  TableShelf,
  TableToggle,
  VenueLink,
} from "@/design-system";
import {
  catalogNumber,
  categoryId,
  SITE_ORIGIN,
  drinkDescription,
  drinkTitle,
  getDrink,
  loadDrinks,
  relatedDrinks,
  shareImage,
  shelfNeighbours,
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
  const neighbours = shelfNeighbours(drink);
  const shelf = `/drink/#${categoryId(drink)}`;
  const folio = `No. ${String(catalogNumber(drink)).padStart(3, "0")} / ${loadDrinks().length}`;
  const still = (priority: boolean) =>
    drink.stillUrl ? (
      <StillLife ratio="1:1" radius="lg" fit="plinth" intro={priority}>
        <ExternalPhoto src={drink.stillUrl} alt={priority ? drink.name : ""} priority={priority} />
      </StillLife>
    ) : undefined;

  return (
    <Motion>
      <ProductHero
        id="drink-title"
        crumbs={[
          { href: "/drink/", label: "一覧" },
          { href: shelf, label: drink.category },
        ]}
        folio={folio}
        title={drink.name}
        meta={drink.size}
        media={still(true)}
        extra={<TableToggle drink={{ slug: drink.slug, name: drink.name, stillUrl: drink.stillUrl, category: drink.category }} />}
      >
        {rows.length > 0 ? <StoreSlot rows={rows} /> : null}
      </ProductHero>

      <Section space="md" label="この一杯">
        <FactList
          label="この一杯"
          facts={AXES.map((axis) => ({ key: axis.key, no: axis.no, title: axis.title, body: drink[axis.key] }))}
        />
      </Section>

      <Section space="md" label="この一杯のカード">
        <TableCard
          id="close-title"
          folio={folio}
          category={drink.category}
          name={drink.name}
          media={still(false)}
          actions={
            primary ? (
              <Button variant="inverse" icon="external" href={primary.href}>
                {storeAction(primary)}
              </Button>
            ) : null
          }
          share={<ShareRow tone="inverse" url={`${SITE_ORIGIN}/drink/${drink.slug}/`} text={`次の飲み会に、これを置く。${drink.name}`} />}
        />
      </Section>

      {neighbours ? (
        <Section space="md" label="前後の一杯">
          <DrinkTrail label={`${drink.category}の前後`} previous={neighbours.previous} next={neighbours.next} />
        </Section>
      ) : null}

      {related.length > 0 ? (
        <Section space="md" labelledBy="related-title">
          <SectionHead id="related-title" eyebrow={drink.category} title={<Phrase>同じカテゴリ</Phrase>} />
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

      <Section space="md" label="この一杯の場">
        <VenueLink
          href="/ba/office/"
          media={<Photo name="place" sizes="(min-width: 768px) 420px, 100vw" position="46% 50%" decorative />}
          eyebrow="この一杯の場"
          title={
            <>
              <Phrase>オフィスの</Phrase>
              <Phrase>オープンな飲み会</Phrase>
            </>
          }
          body="デスクまわりが、そのまま飲み会の場になる。この場の6杯へ。"
        />
      </Section>

      <TableShelf exclude={drink.slug} known={loadDrinks().map((item) => item.slug)} />

      {primary ? <StoreDock name={drink.name} href={primary.href} action={storeAction(primary)} anchorId="store-row" /> : null}
    </Motion>
  );
}
