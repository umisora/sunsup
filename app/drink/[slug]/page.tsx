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
  SeasonStill,
  ShareRow,
  SITE_NAME,
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
import { OUT_LINKS_ID, outLinkMap } from "@/lib/out-links";
import { hasSeasonStills } from "@/lib/still-seasons";
import { seasonOf } from "@/lib/visit";

type DrinkPageProps = {
  params: Promise<{ slug: string }>;
};

const AXES = [
  { key: "place", no: "01", title: "場面" },
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
      title: `${title}｜${SITE_NAME}`,
      description,
      url: `/drink/${drink.slug}/`,
      siteName: SITE_NAME,
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
  // Drinks with seasonal studio stills open on today's season; the white cutout stays for the close-up card.
  const hero = hasSeasonStills(drink.slug) ? (
    <SeasonStill slug={drink.slug} alt={drink.name} season={seasonOf(new Date())} priority intro />
  ) : (
    still(true)
  );

  // Read by the click beacon to tell which store a link goes to. "<" is escaped so the JSON cannot close the tag.
  const outLinks = JSON.stringify(outLinkMap(drink.slug, rows)).replace(/</g, "\\u003c");

  return (
    <Motion>
      {rows.length > 0 ? <script type="application/json" id={OUT_LINKS_ID} dangerouslySetInnerHTML={{ __html: outLinks }} /> : null}
      <ProductHero
        id="drink-title"
        crumbs={[
          { href: "/drink/", label: "ドリンク一覧" },
          { href: shelf, label: drink.category },
        ]}
        folio={folio}
        title={drink.name}
        meta={drink.size}
        media={hero}
        extra={<TableToggle drink={{ slug: drink.slug, name: drink.name, stillUrl: drink.stillUrl, category: drink.category }} />}
      >
        {rows.length > 0 ? <StoreSlot rows={rows} /> : null}
      </ProductHero>

      <Section space="md" label="このドリンク">
        <FactList
          label="このドリンク"
          facts={AXES.map((axis) => ({ key: axis.key, no: axis.no, title: axis.title, body: drink[axis.key] }))}
        />
      </Section>

      <Section space="md" label="このドリンクの紹介">
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
          share={<ShareRow tone="inverse" url={`${SITE_ORIGIN}/drink/${drink.slug}/`} text={`${drink.name}｜次の飲み会に。${SITE_NAME}`} />}
        />
      </Section>

      {neighbours ? (
        <Section space="md" label="前後のドリンク">
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

      <Section space="md" label="オフィスの飲み会">
        <VenueLink
          href="/ba/office/"
          media={<Photo name="place" sizes="(min-width: 768px) 420px, 100vw" position="46% 50%" decorative />}
          eyebrow="オフィスの飲み会"
          title={
            <>
              <Phrase>オフィスの</Phrase>
              <Phrase>オープンな飲み会</Phrase>
            </>
          }
          body="定時後に会議室を囲む飲み会です。おすすめの6本も、こちらにあります。"
        />
      </Section>

      <TableShelf exclude={drink.slug} known={loadDrinks().map((item) => item.slug)} />

      {primary ? <StoreDock name={drink.name} href={primary.href} action={storeAction(primary)} anchorId="store-row" /> : null}
    </Motion>
  );
}
