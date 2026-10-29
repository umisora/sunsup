"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { daypartOf, DEFAULT_STORY_ID, seasonOf, storyById, type VisitStory } from "@/lib/visit";
import { seasonStillUrl } from "@/lib/still-seasons";
import { pickVisitStories, replacementDrink, type PickedDrink, type PickedStory } from "@/lib/visit-picks";
import { Chip } from "../Chip/Chip";
import { DrinkShowcase } from "../DrinkShowcase/DrinkShowcase";
import { HeroStage, type HeroFrame, type HeroTableDrink } from "../HeroStage/HeroStage";
import { Section, Stack } from "../Layout/Layout";
import { TABLE_CAST } from "../TableArrival/cast";
import { Phrase, Text } from "../Text/Text";

type VisitHeroProps = {
  labelledBy: string;
  initialId: string;
  aside?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
};

function requireStory(id: string): VisitStory {
  const story = storyById(id) ?? storyById(DEFAULT_STORY_ID);
  if (!story) {
    throw new Error("default visit story missing");
  }
  return story;
}

function fallbackDrinks(story: VisitStory): HeroTableDrink[] {
  return story.slugs.map((slug) => {
    const cast = TABLE_CAST[slug];
    if (!cast) {
      throw new Error(`hero drink missing: ${slug}`);
    }
    return { slug: cast.slug, name: cast.name, src: cast.src, stand: cast.stand, frame: cast.frame };
  });
}

function isFrame(value: unknown): value is HeroFrame {
  if (!value || typeof value !== "object") {
    return false;
  }
  const frame = value as Record<string, unknown>;
  return [frame.nw, frame.nh, frame.l, frame.t, frame.cw, frame.ch].every((item) => typeof item === "number" && Number.isFinite(item));
}

function readDrink(value: unknown): PickedDrink | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const row = value as Record<string, unknown>;
  if (typeof row.slug !== "string" || typeof row.name !== "string" || typeof row.src !== "string") {
    return undefined;
  }
  if (!row.src.startsWith("/drinks/") || row.src.includes("fallback-")) {
    return undefined;
  }
  if (row.stand !== "full" && row.stand !== "can") {
    return undefined;
  }
  const frame = row.frame;
  if (!isFrame(frame)) {
    return undefined;
  }
  return {
    slug: row.slug,
    name: row.name,
    src: row.src,
    category: typeof row.category === "string" ? row.category : "",
    size: typeof row.size === "string" ? row.size : "",
    stand: row.stand,
    frame,
  };
}

function readStories(value: unknown): PickedStory[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const stories: PickedStory[] = [];
  const used = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || !storyById(row.id) || !Array.isArray(row.drinks)) {
      continue;
    }
    const drinks = row.drinks.flatMap((drink) => {
      const parsed = readDrink(drink);
      if (!parsed || used.has(parsed.slug)) {
        return [];
      }
      used.add(parsed.slug);
      return [parsed];
    });
    if (drinks.length < 2 || drinks.length > 3) {
      continue;
    }
    stories.push({ id: row.id, drinks });
    if (stories.length === 3) {
      break;
    }
  }
  return stories;
}

function heroDrinks(drinks: readonly PickedDrink[]): HeroTableDrink[] {
  return drinks.map((drink) => ({
    slug: drink.slug,
    name: drink.name,
    src: drink.src,
    stand: drink.stand,
    frame: drink.frame,
  }));
}

/** Home hero whose story and stills can change after the static default has painted. */
export function VisitHero({ labelledBy, initialId, aside, title, actions }: VisitHeroProps) {
  const [page, setPage] = useState<PickedStory[] | null>(null);
  const [broken, setBroken] = useState<readonly string[]>([]);
  const [extras, setExtras] = useState<readonly PickedDrink[]>([]);
  const primary = page?.[0];
  const story = requireStory(primary?.id ?? initialId);
  const picked = primary ? heroDrinks(primary.drinks) : fallbackDrinks(story);
  const brokenSet = new Set(broken);
  const replaced = [...picked.filter((drink) => !brokenSet.has(drink.slug)), ...extras.map((drink) => ({
    slug: drink.slug,
    name: drink.name,
    src: drink.src,
    stand: drink.stand,
    frame: drink.frame,
  }))];
  const drinks = replaced.length >= 2 ? replaced.slice(0, 3) : picked;
  const drinkIds = drinks.map((drink) => drink.slug).join(" ");
  const storyRef = useRef(story);
  const pickedRef = useRef(picked);
  const extrasRef = useRef(extras);
  const seen = useRef(new Set<string>());
  storyRef.current = story;
  pickedRef.current = picked;
  extrasRef.current = extras;

  const sourceKey = picked.map((drink) => drink.slug).join(" ");
  const sourceKeyRef = useRef(sourceKey);
  useEffect(() => {
    if (sourceKeyRef.current === sourceKey) {
      return;
    }
    sourceKeyRef.current = sourceKey;
    seen.current = new Set();
    extrasRef.current = [];
    setBroken([]);
    setExtras([]);
  }, [sourceKey]);

  const onStillError = useCallback((slug: string) => {
    if (seen.current.has(slug) || seen.current.size >= 8) {
      return;
    }
    seen.current.add(slug);
    const avoid = new Set<string>([...seen.current, ...pickedRef.current.map((drink) => drink.slug), ...extrasRef.current.map((drink) => drink.slug)]);
    const next = replacementDrink(storyRef.current.id, { season: seasonOf(new Date()), daypart: daypartOf(new Date()) }, [...avoid]);
    if (next) {
      seen.current.add(next.slug);
      extrasRef.current = [...extrasRef.current, next];
      setExtras(extrasRef.current);
    }
    setBroken((current) => (current.includes(slug) ? current : [...current, slug]));
  }, []);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("story") ?? undefined;
    const storyId = requested && storyById(requested) ? requested : undefined;
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 1800);
    const local = () =>
      pickVisitStories({
        season: seasonOf(new Date()),
        daypart: daypartOf(new Date()),
        storyId,
        random: Math.random,
      });

    const apply = (stories: PickedStory[]) => {
      if (!cancelled && stories.length > 0) {
        setPage(stories);
      }
    };

    const endpoint = storyId ? `/api/visit?story=${encodeURIComponent(storyId)}` : "/api/visit";
    fetch(endpoint, { signal: controller.signal, headers: { accept: "application/json" }, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("visit");
        }
        const body = (await response.json()) as { stories?: unknown };
        const stories = readStories(body.stories);
        if (stories.length === 0) {
          throw new Error("visit");
        }
        apply(stories);
      })
      .catch(() => {
        apply(local());
      })
      .finally(() => {
        window.clearTimeout(timer);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const more = (page ?? []).slice(1);
  // Stories only render after the visit is picked on the client, so today's JST season is safe here.
  const season = seasonOf(new Date());

  return (
    <div data-visit-ready={page ? "1" : "0"}>
      <HeroStage
        labelledBy={labelledBy}
        drinks={drinks}
        castKey={`${story.id}:${drinkIds}`}
        visitId={story.id}
        drinkIds={drinkIds}
        aside={aside}
        title={title}
        actions={actions}
        onStillError={onStillError}
      >
        <Chip intro>{story.kicker}</Chip>
        <Text variant="lead" intro>
          {/* Keyed so a story swap replaces the lines instead of moving them (no layout shift).
              The <p> keeps its node, so its motion state and reserved height stay put. */}
          <Fragment key={story.id}>
            <Phrase>{story.lead[0]}</Phrase>
            <br />
            <Phrase>{story.lead[1]}</Phrase>
          </Fragment>
        </Text>
      </HeroStage>
      {more.map((item) => {
        const extra = storyById(item.id);
        if (!extra) {
          return null;
        }
        const ids = item.drinks.map((drink) => drink.slug).join(" ");
        return (
          <Section key={item.id} space="md" labelledBy={`visit-${item.id}`}>
            <div data-visit-story={item.id} data-drinks={ids}>
              <Stack gap={4}>
                <Chip>{extra.kicker}</Chip>
                <Text variant="lead" id={`visit-${item.id}`}>
                  <Phrase>{extra.lead[0]}</Phrase>
                  <br />
                  <Phrase>{extra.lead[1]}</Phrase>
                </Text>
                <DrinkShowcase
                  label={extra.kicker}
                  stagger={false}
                  drinks={item.drinks.map((drink) => ({
                    slug: drink.slug,
                    name: drink.name,
                    stillUrl: drink.src,
                    seasonUrl: seasonStillUrl(drink.slug, season),
                    size: drink.size,
                    label: drink.category,
                  }))}
                />
              </Stack>
            </div>
          </Section>
        );
      })}
    </div>
  );
}
