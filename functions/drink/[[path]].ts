import { SEASON_SLUGS } from "../../lib/season-slugs";
import { seasonOf } from "../../lib/visit";

/**
 * Drink pages with seasonal stills (lib/season-slugs.ts). Other drink pages pass through untouched.
 * The static HTML carries the season of the build; this swaps the hero still to today's season
 * in JST before the page leaves the edge, so the first paint already shows the right photo.
 */

type ElementLike = {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
};

type Rewriter = {
  on(selector: string, handlers: { element(element: ElementLike): void }): Rewriter;
  transform(response: Response): Response;
};

declare const HTMLRewriter: { new (): Rewriter };

type PagesContext = {
  request: Request;
  next: () => Promise<Response>;
};

const SLUG = /^[a-z0-9-]+$/;
const SEASON_FILE = /_(?:spring|summer|autumn|winter)\.webp/g;

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const response = await context.next();
  const pageSlug = /^\/drink\/([a-z0-9-]+)\/$/.exec(new URL(context.request.url).pathname)?.[1];
  if (!pageSlug || !SEASON_SLUGS.has(pageSlug)) {
    return response;
  }
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) {
    return response;
  }
  const season = seasonOf(new Date());
  // The body changes with the season, so the asset's ETag no longer describes it.
  const headers = new Headers(response.headers);
  headers.delete("etag");
  const page = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  // Keep the srcset (480w / 800w / 1200w copies) on the same season as src.
  const srcSet = (slug: string) => {
    const file = `${slug}_${season}.webp`;
    return `/drinks/season/480/${file} 480w, /drinks/season/800/${file} 800w, /drinks/season/${file} 1200w`;
  };
  return new HTMLRewriter()
    .on("img[data-season-still]", {
      element(element) {
        const slug = element.getAttribute("data-season-still") ?? "";
        if (!SLUG.test(slug)) {
          return;
        }
        element.setAttribute("src", `/drinks/season/${slug}_${season}.webp`);
        // React writes srcSet; HTML attribute names are case-insensitive, so check both spellings.
        for (const name of ["srcset", "srcSet"]) {
          if (element.getAttribute(name) !== null) {
            element.setAttribute(name, srcSet(slug));
            break;
          }
        }
        element.setAttribute("data-season", season);
      },
    })
    // React emits a preload for the eager hero <img>; move it to the same season so only one file loads.
    .on("link[rel=preload][as=image]", {
      element(element) {
        for (const name of ["href", "imagesrcset", "imageSrcSet"]) {
          const value = element.getAttribute(name);
          if (value && value.includes(`/drinks/season/`) && value.includes(`/${pageSlug}_`)) {
            element.setAttribute(name, value.replace(SEASON_FILE, `_${season}.webp`));
            if (name !== "href") {
              break;
            }
          }
        }
      },
    })
    .transform(page);
}
