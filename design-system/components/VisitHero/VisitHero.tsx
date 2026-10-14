"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DEFAULT_STORY_ID, resolveVisit, seasonOf, storyById, daypartOf, type VisitStory } from "@/lib/visit";
import { Chip } from "../Chip/Chip";
import { HeroStage } from "../HeroStage/HeroStage";
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
  return storyById(id) ?? storyById(DEFAULT_STORY_ID) ?? resolveVisit({ season: "autumn", daypart: "afternoon", storyId: DEFAULT_STORY_ID });
}

function drinksFor(story: VisitStory) {
  return story.slugs.map((slug) => {
    const cast = TABLE_CAST[slug];
    if (!cast) {
      throw new Error(`hero drink missing: ${slug}`);
    }
    return { slug: cast.slug, name: cast.name, src: cast.src };
  });
}

/** Home hero whose story and stills can change after the static default has painted. */
export function VisitHero({ labelledBy, initialId, aside, title, actions }: VisitHeroProps) {
  const [id, setId] = useState(initialId);
  const story = requireStory(id);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("story");
    if (requested && storyById(requested)) {
      setId(requested);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 1800);
    fetch("/api/visit", { signal: controller.signal, headers: { accept: "application/json" }, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("visit");
        }
        const body = (await response.json()) as { id?: unknown };
        if (cancelled) {
          return;
        }
        if (typeof body.id === "string" && storyById(body.id)) {
          setId(body.id);
          return;
        }
        throw new Error("visit");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        const next = resolveVisit({
          season: seasonOf(new Date()),
          daypart: daypartOf(new Date()),
          random: Math.random,
        });
        setId(next.id);
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

  return (
    <HeroStage
      labelledBy={labelledBy}
      drinks={drinksFor(story)}
      castKey={story.id}
      visitId={story.id}
      aside={aside}
      title={title}
      actions={actions}
    >
      <Chip intro>{story.kicker}</Chip>
      <Text variant="lead" intro>
        <Phrase>{story.lead[0]}</Phrase>
        <br />
        <Phrase>{story.lead[1]}</Phrase>
      </Text>
    </HeroStage>
  );
}
