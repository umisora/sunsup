"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Same list as runMotion.ts: what styles/motion.css pre-hides on wide screens. */
const HIDDEN_MOTION = "[data-intro], [data-line], [data-reveal], [data-stagger-item], [data-intro-media]";

/**
 * Page-level motion. Wrap each page once; components opt in through data attributes
 * (see docs/design-system.md). Everything runs inside matchMedia so reduced motion gets a static page.
 * GSAP is fetched after hydration (runMotion.ts), so it is not part of any page's first-load JS.
 */
export function Motion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = root.current;
    if (!scope) {
      return;
    }
    let stop: (() => void) | undefined;
    let cancelled = false;
    import("./runMotion")
      .then(({ startMotion }) => {
        if (!cancelled) {
          stop = startMotion(scope);
        }
      })
      .catch(() => {
        // The chunk did not load: show everything instead of leaving pre-hidden content blank.
        scope.querySelectorAll<HTMLElement>(HIDDEN_MOTION).forEach((element) => {
          element.style.setProperty("visibility", "visible", "important");
          element.style.setProperty("clip-path", "none", "important");
        });
      });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
