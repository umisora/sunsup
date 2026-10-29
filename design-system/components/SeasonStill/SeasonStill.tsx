"use client";

import { useEffect, useState } from "react";
import { seasonOf, type Season } from "@/lib/visit";
import { SEASON_HERO_SIZES, seasonStillSrcSet, seasonStillUrl } from "@/lib/still-seasons";
import { StillLife } from "../StillLife/StillLife";

type SeasonStillProps = {
  slug: string;
  alt: string;
  /** Season baked into the static HTML. The Pages Function on /drink/<slug>/ rewrites it to today's season. */
  season: Season;
  /** The LCP image of the page. Only one per page. */
  priority?: boolean;
  intro?: boolean;
  ratio?: "1:1" | "4:5";
};

/**
 * A seasonal studio still: an opaque photo, so it fills the frame with no plinth and no multiply.
 * The frame has a fixed ratio, so swapping the season never moves the layout. After hydration
 * the season follows the visitor's clock in JST, which also covers client-side navigation.
 */
export function SeasonStill({ slug, alt, season, priority = false, intro = false, ratio = "1:1" }: SeasonStillProps) {
  const [current, setCurrent] = useState<Season>(season);
  useEffect(() => {
    setCurrent(seasonOf(new Date()));
  }, []);
  const src = seasonStillUrl(slug, current);
  return (
    <StillLife ratio={ratio} radius="lg" fit="cover" intro={intro}>
      <img
        src={src}
        srcSet={seasonStillSrcSet(slug, current)}
        sizes={SEASON_HERO_SIZES}
        alt={alt}
        width={1200}
        height={1200}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        data-season-still={slug}
        data-season={current}
        suppressHydrationWarning
      />
    </StillLife>
  );
}
