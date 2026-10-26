/**
 * The old production host sunsup-dv4.pages.dev moves to stylish.sunsup.me with a 301, same path and query.
 * Branch previews (<branch>.sunsup-dv4.pages.dev, <hash>.sunsup-dv4.pages.dev) are a different host and stay as they are.
 * Renamed pages move with a 301 on the same host. This lives here and not in public/_redirects, because
 * Pages does not apply _redirects to requests that run Functions, and this middleware runs on every path.
 */

const OLD_HOST = "sunsup-dv4.pages.dev";
const NEW_ORIGIN = "https://stylish.sunsup.me";

/** Old path, with and without the trailing slash, to its new path. */
export const MOVED: Record<string, string> = {
  "/ba/nomanai-hito/": "/ba/okurimono/",
  "/ba/nomanai-hito": "/ba/okurimono/",
};

type PagesContext = {
  request: Request;
  next: () => Promise<Response>;
};

export async function onRequest(context: PagesContext): Promise<Response> {
  const url = new URL(context.request.url);
  if (url.hostname === OLD_HOST) {
    return new Response(null, {
      status: 301,
      headers: { location: `${NEW_ORIGIN}${url.pathname}${url.search}`, "cache-control": "public, max-age=86400" },
    });
  }
  const moved = MOVED[url.pathname];
  if (moved) {
    return new Response(null, {
      status: 301,
      headers: { location: `${url.origin}${moved}${url.search}`, "cache-control": "public, max-age=86400" },
    });
  }
  return context.next();
}
