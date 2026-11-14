/**
 * The old production host sunsup-dv4.pages.dev moves to stylish.sunsup.me with a 301, same path and query.
 * Branch previews (<branch>.sunsup-dv4.pages.dev, <hash>.sunsup-dv4.pages.dev) are a different host and stay as they are.
 * Renamed pages move with a 301 on the same host. Repeated slashes and /index.html fold onto the trailing-slash URL first.
 * Next's static export also writes an RSC payload at index.txt beside each page. Those files stay fetchable for the
 * client router and answer with noindex. This lives here and not in public/_redirects, because Pages does not apply
 * _redirects to requests that run Functions, and this middleware runs on every path.
 */

const OLD_HOST = "sunsup-dv4.pages.dev";
const NEW_ORIGIN = "https://stylish.sunsup.me";

/** Old path, with and without the trailing slash, to its new path. */
export const MOVED: Record<string, string> = {
  "/ba/nomanai-hito/": "/ba/okurimono/",
  "/ba/nomanai-hito": "/ba/okurimono/",
  "/drink/sanpellegrino-limonata-pet/": "/drink/sanpellegrino-limonata/",
  "/drink/sanpellegrino-limonata-pet": "/drink/sanpellegrino-limonata/",
  "/drink/kirin-namacha-400/": "/drink/namacha-525/",
  "/drink/kirin-namacha-400": "/drink/namacha-525/",
};

type PagesContext = {
  request: Request;
  next: () => Promise<Response>;
};

/** Collapse repeated slashes and fold /index.html onto the directory URL. */
export function normalizePathname(pathname: string): string {
  let path = pathname.replace(/\/{2,}/g, "/");
  if (path.endsWith("/index.html")) {
    path = path.slice(0, -"index.html".length) || "/";
  }
  return path;
}

/**
 * Pathname plus search to 301 to, or null when the request is already on a canonical path.
 * Moved slugs win over the folded form, so an old slug with a double slash goes straight to the kept URL.
 */
export function redirectPath(pathname: string, search = ""): string | null {
  const normalized = normalizePathname(pathname);
  const target = MOVED[normalized] ?? (normalized !== pathname ? normalized : null);
  if (!target) {
    return null;
  }
  return `${target}${search}`;
}

/** RSC flight payload written next to each exported page. Not /robots.txt. */
export function isRscPayload(pathname: string): boolean {
  return pathname === "/index.txt" || pathname.endsWith("/index.txt");
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const url = new URL(context.request.url);
  const redirected = redirectPath(url.pathname, url.search);
  if (url.hostname === OLD_HOST) {
    const path = redirected ?? `${url.pathname}${url.search}`;
    return new Response(null, {
      status: 301,
      headers: { location: `${NEW_ORIGIN}${path}`, "cache-control": "public, max-age=86400" },
    });
  }
  if (redirected) {
    return new Response(null, {
      status: 301,
      headers: { location: `${url.origin}${redirected}`, "cache-control": "public, max-age=86400" },
    });
  }
  const response = await context.next();
  if (!isRscPayload(url.pathname)) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.set("x-robots-tag", "noindex");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
