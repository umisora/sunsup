import type { MetadataRoute } from "next";
import { loadDrinks, SITE_ORIGIN } from "@/lib/drinks";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/ba/office/", "/about/", "/drink/", ...loadDrinks().map((drink) => `/drink/${drink.slug}/`)];
  return paths.map((path) => ({ url: `${SITE_ORIGIN}${path}` }));
}
