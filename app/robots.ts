import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/drinks";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // RSC flight data sits at /index.txt and /<path>/index.txt. The client
      // router fetches it. Crawlers should not treat it as a page.
      disallow: "/*index.txt$",
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
