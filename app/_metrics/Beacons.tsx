"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isOutKind, OUT_LINKS_ID, type OutLinkMap } from "@/lib/out-links";

/**
 * Counts page views and store-link clicks with navigator.sendBeacon.
 * Nothing here touches the click itself: the link opens as usual even if the beacon is blocked or fails.
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
    // Links outside a drink page (the scene shopping list) name their drink and kind on the link itself.
    const slug = target.getAttribute("data-out-slug");
    const tagged = target.getAttribute("data-out-kind");
    if (slug && isOutKind(tagged)) {
      send("/api/click", { slug, kind: tagged, path: window.location.pathname, source: target.getAttribute("data-out-source") ?? "page" });
      return;
    }
    const map = linkMap();
    const kind = map?.links[href];
    if (!map || !isOutKind(kind)) {
      return;
    }
    send("/api/click", { slug: map.slug, kind, path: window.location.pathname, source: "page" });
  } catch {
    // Never get in the way of the link.
  }
}

export function Beacons() {
  const pathname = usePathname();

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
