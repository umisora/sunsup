/** Owner's Rakuten Affiliate ichiba id, from the generated hybrid link. */
export const RAKUTEN_AFFILIATE_ID = "09c4c923.474b7a2d.09c4c924.410ae089";

/** Owner's 計測ID. The leading underscore is part of the id. */
export const RAKUTEN_MEASUREMENT_ID = "_RTLink156674";

const RAKUTEN_AFFILIATE_HOST = "hb.afl.rakuten.co.jp";

function httpUrl(value: string): URL | undefined {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

function isRakutenHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "rakuten.co.jp" || host.endsWith(".rakuten.co.jp");
}

/**
 * Rakuten destination URLs go out through the owner's affiliate link.
 * Anything else, including a URL that is already on the affiliate host, is returned as written.
 */
export function rakutenAffiliateUrl(url: string): string {
  const parsed = httpUrl(url);
  if (!parsed) {
    return url;
  }
  const host = parsed.hostname.toLowerCase();
  if (host === RAKUTEN_AFFILIATE_HOST || !isRakutenHost(host)) {
    return url;
  }
  const pc = encodeURIComponent(url);
  return `https://${RAKUTEN_AFFILIATE_HOST}/ichiba/${RAKUTEN_AFFILIATE_ID}/${RAKUTEN_MEASUREMENT_ID}?pc=${pc}&link_type=hybrid_url`;
}

/** The store URL a click should be counted against. Affiliate hops resolve back to the pc target. */
export function rakutenDestinationUrl(href: string): string {
  const parsed = httpUrl(href);
  if (!parsed || parsed.hostname.toLowerCase() !== RAKUTEN_AFFILIATE_HOST) {
    return href;
  }
  const pc = parsed.searchParams.get("pc");
  if (!pc || !httpUrl(pc)) {
    return href;
  }
  return pc;
}
