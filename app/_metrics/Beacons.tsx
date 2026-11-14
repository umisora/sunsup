"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isOutKind, OUT_LINKS_ID, type OutKind, type OutLinkMap } from "@/lib/out-links";
import { captureOutboundClick } from "@/lib/web-analytics";
import { flushHeadcountChange, outboundUsageProps, resetUsageSession, venueFromPath } from "@/lib/usage-session";

/**
 * Counts page views and store-link clicks with navigator.sendBeacon.
 * Nothing here touches the click itself: the link opens as usual even if the beacon is blocked or fails.
 * On the same click, PostHog also gets an outbound_click when analytics is live.
 */

function send(endpoint: string, body: Record<string, string>): void {
  try {
    const payload = new Blob([JSON.stringify(body)], { type: "text/plain;charset=UTF-8" });
    if (navigator.sendBeacon?.(endpoint, payload)) {
      return;
    }
    void fetch(endpoint, { method: "POST", body: payload, keepalive: true, credentials: "omit" }).catch(() => undefined);
  } catch {
    // Counting is best effort.
  }
}

function linkMap(): OutLinkMap | undefined {
  const text = document.getElementById(OUT_LINKS_ID)?.textContent;
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as OutLinkMap;
  } catch {
    return undefined;
  }
}

type ResolvedShop = {
  slug: string;
  kind: OutKind;
  source: string;
  href: string;
};

function resolveShop(anchor: Element, href: string): ResolvedShop | null {
  const slug = anchor.getAttribute("data-out-slug");
  const tagged = anchor.getAttribute("data-out-kind");
  if (slug && isOutKind(tagged)) {
    return {
      slug,
      kind: tagged,
      source: anchor.getAttribute("data-out-source") ?? "page",
      href,
    };
  }
  const map = linkMap();
  const kind = map?.links[href];
  if (!map || !isOutKind(kind)) {
    return null;
  }
  return { slug: map.slug, kind, source: "page", href };
}

function shopHost(href: string): string | null {
  try {
    return new URL(href, window.location.href).hostname;
  } catch {
    return null;
  }
}

/** 0-based index among shop links on the page (document order). */
function shopPosition(anchor: Element): number {
  let index = 0;
  for (const node of document.querySelectorAll("a[href]")) {
    if (!(node instanceof Element)) {
      continue;
    }
    const href = node.getAttribute("href");
    if (!href || !resolveShop(node, href)) {
      continue;
    }
    if (node === anchor) {
      return index;
    }
    index += 1;
  }
  return index;
}

function onClick(event: MouseEvent): void {
  try {
    if (event.type === "auxclick" && event.button !== 1) {
      return;
    }
    const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
    const href = target?.getAttribute("href");
    if (!target || !href) {
      return;
    }
    const shop = resolveShop(target, href);
    if (!shop) {
      return;
    }
    // D1 click beacon — unchanged payload and endpoint.
    send("/api/click", {
      slug: shop.slug,
      kind: shop.kind,
      path: window.location.pathname,
      source: shop.source,
    });
    flushHeadcountChange();
    const host = shopHost(shop.href);
    if (!host) {
      return;
    }
    const path = window.location.pathname;
    const usage = outboundUsageProps(shop.source, target.closest("[data-list-role]")?.getAttribute("data-list-role"));
    captureOutboundClick({
      shop: shop.kind,
      host,
      drinkSlug: shop.slug,
      path,
      venue: venueFromPath(path),
      position: shopPosition(target),
      source: shop.source,
      headcount: usage.headcount,
      headcountChanged: usage.headcountChanged,
      countTableViewed: usage.countTableViewed,
      role: usage.role,
      viewport: usage.viewport,
    });
  } catch {
    // Never get in the way of the link.
  }
}

export function Beacons() {
  const pathname = usePathname();
  // During render, before the table and list effects. This component sits after
  // the page in the layout, so an effect here would run too late and wipe them.
  if (pathname) {
    resetUsageSession(pathname);
  }

  useEffect(() => {
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);

  useEffect(() => {
    if (pathname) {
      send("/api/view", { path: pathname });
    }
  }, [pathname]);

  return null;
}
