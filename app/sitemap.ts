import type { MetadataRoute } from "next";
import { loadDrinks, SITE_ORIGIN } from "@/lib/drinks";
import { SCENES, scenePath } from "@/lib/scenes";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/ba/office/", ...SCENES.map(scenePath), "/about/", "/drink/", ...loadDrinks().map((drink) => `/drink/${drink.slug}/`)];
  return paths.map((path) => ({ url: `${SITE_ORIGIN}${path}` }));
}
