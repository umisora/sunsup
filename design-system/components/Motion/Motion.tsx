"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion } from "../../motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Page-level motion. Wrap each page once; components opt in through data attributes
 * (see docs/design-system.md). Everything runs inside matchMedia so reduced motion gets a static page.
 */
export function Motion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope) {
        return;
      }

      const mm = gsap.matchMedia();
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 768px)" }, (context) => {
        const { motion: allowed, wide } = context.conditions ?? {};
        if (!allowed) {
          return;
        }
        try {
          // Phones paint the still and the name immediately. The load tween's from-state
          // would clip them again via immediateRender.
          if (wide) {
            playIntro(scope);
          }
          // Created top-to-bottom: the peak pin spacer must exist before triggers below it are measured.
          openPeak(scope, Boolean(wide));
          driftMedia(scope);
          revealOnScroll(scope, Boolean(wide));
        } catch {
          forceVisible(scope, "all");
        }
        const disarm = armFailOpen(scope);
        return () => {
          disarm();
        };
      });

      const refresh = () => ScrollTrigger.refresh();
      const pending = Array.from(scope.querySelectorAll("img")).filter((img) => !img.complete);
      pending.forEach((img) => img.addEventListener("load", refresh, { once: true }));

      return () => {
        pending.forEach((img) => img.removeEventListener("load", refresh));
        mm.revert();
      };
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}

function playIntro(scope: HTMLElement) {
  const timeline = gsap.timeline({ defaults: { ease: motion.ease.enter } });
  const media = scope.querySelector("[data-intro-media]");
  const lines = scope.querySelectorAll("[data-line]");
  const items = scope.querySelectorAll("[data-intro]");

  timeline.addLabel("media", 0).addLabel("type", media ? 0.5 : 0.1);

  if (media) {
    timeline.fromTo(
      media,
      { clipPath: "inset(0% 0% 100% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: motion.duration.mediaReveal, ease: motion.ease.reveal },
      "media",
    );
    const image = media.querySelector("img");
    if (image) {
      timeline.fromTo(image, { scale: 1.14 }, { scale: 1, duration: motion.duration.mediaSettle }, "media");
    }
  }

  if (lines.length > 0) {
    timeline.fromTo(
      lines,
      { yPercent: 105, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: motion.duration.line, stagger: motion.stagger.line },
      "type",
    );
  }

  if (items.length > 0) {
    timeline.fromTo(
      items,
      { y: motion.distance.intro, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: motion.duration.item, stagger: motion.stagger.item },
      "type+=0.2",
    );
  }
}

function openPeak(scope: HTMLElement, wide: boolean) {
  const stage = scope.querySelector<HTMLElement>("[data-peak-stage]");
  const frame = stage?.querySelector<HTMLElement>("[data-peak-frame]");
  const image = frame?.querySelector("img");
  const copy = stage?.querySelector<HTMLElement>("[data-peak-copy]");
  if (!stage || !frame || !image || !copy) {
    return;
  }

  const inset = wide ? "inset(8% 14% 8% 14% round 28px)" : "inset(6% 5% 6% 5% round 22px)";
  const timeline = gsap.timeline({
    defaults: { ease: motion.ease.scrub },
    scrollTrigger: wide
      ? { trigger: stage, start: "top top", end: "+=90%", pin: true, scrub: motion.scrub.peak, anticipatePin: 1 }
      : { trigger: stage, start: "top 85%", end: "top 15%", scrub: motion.scrub.peakNarrow },
  });

  timeline
    .fromTo(frame, { clipPath: inset }, { clipPath: "inset(0% 0% 0% 0% round 0px)" }, 0)
    .fromTo(image, { scale: 1.16 }, { scale: 1 }, 0)
    .fromTo(copy, { y: motion.distance.intro }, { y: 0 }, 0.1);
}

function driftMedia(scope: HTMLElement) {
  scope.querySelectorAll<HTMLElement>("[data-parallax]").forEach((frame) => {
    const image = frame.querySelector("img");
    if (!image) {
      return;
    }
    gsap.fromTo(
      image,
      { yPercent: -motion.distance.parallax },
      {
        yPercent: motion.distance.parallax,
        ease: motion.ease.scrub,
        scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });

  scope.querySelectorAll<HTMLElement>("[data-drift]").forEach((element) => {
    gsap.to(element, {
      y: motion.distance.drift,
      ease: motion.ease.scrub,
      scrollTrigger: {
        trigger: element.closest("section") ?? element,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  });
}

function revealOnScroll(scope: HTMLElement, wide: boolean) {
  scope.querySelectorAll<HTMLElement>("[data-fill]").forEach((element) => {
    gsap.fromTo(
      element.querySelectorAll("[data-fill-char]"),
      { opacity: 0.2 },
      {
        opacity: 1,
        ease: motion.ease.scrub,
        stagger: motion.stagger.char,
        scrollTrigger: { trigger: element, start: "top 82%", end: "bottom 48%", scrub: motion.scrub.fill },
      },
    );
  });

  scope.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
    if (!wide && inFirstScreen(element)) {
      return;
    }
    gsap.fromTo(
      element,
      { y: motion.distance.reveal, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: motion.duration.line,
        ease: motion.ease.enter,
        scrollTrigger: { trigger: element, start: "top 86%", once: true },
      },
    );
  });

  scope.querySelectorAll<HTMLElement>("[data-rise]").forEach((element) => {
    gsap.from(element, {
      y: motion.distance.rise,
      duration: motion.duration.rise,
      ease: motion.ease.enter,
      immediateRender: false,
      scrollTrigger: { trigger: element, start: "top 92%", once: true },
    });
  });

  const items = gsap.utils.toArray<HTMLElement>("[data-stagger-item]", scope);
  const staged = wide ? items : items.filter((item) => !inFirstScreen(item));
  if (staged.length > 0) {
    gsap.set(staged, { y: motion.distance.card, autoAlpha: 0 });
  }
  if (items.length > 0) {
    ScrollTrigger.batch(items, {
      start: "top 90%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          y: 0,
          autoAlpha: 1,
          duration: motion.duration.card,
          stagger: motion.stagger.card,
          ease: motion.ease.enter,
          overwrite: true,
        }),
    });
  }
}

const HIDDEN_MOTION = "[data-intro], [data-line], [data-reveal], [data-stagger-item], [data-intro-media]";

function inFirstScreen(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const height = window.innerHeight;
  return rect.bottom > 0 && rect.top < height * 0.92;
}

function clipClosed(element: HTMLElement): boolean {
  const clipPath = getComputedStyle(element).clipPath;
  if (clipPath === "none" || clipPath === "") {
    return false;
  }
  const match = /inset\(\s*([-\d.]+)(px|%)\s+[-\d.]+(?:px|%)\s+([-\d.]+)(px|%)/i.exec(clipPath);
  if (!match) {
    return clipPath.includes("100%");
  }
  const bottom = Number(match[3]);
  if (match[4] === "%") {
    return bottom >= 99;
  }
  const height = element.getBoundingClientRect().height;
  return height > 0 && bottom >= height - 1;
}

function isHidden(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  if (style.visibility === "hidden" || Number.parseFloat(style.opacity) < 0.05) {
    return true;
  }
  return element.hasAttribute("data-intro-media") && clipClosed(element);
}

function showElement(element: HTMLElement) {
  element.style.setProperty("visibility", "visible", "important");
  element.style.setProperty("opacity", "1", "important");
  element.style.removeProperty("transform");
  if (!element.hasAttribute("data-intro-media")) {
    return;
  }
  element.style.setProperty("clip-path", "none", "important");
  const image = element.querySelector("img");
  if (image instanceof HTMLElement) {
    image.style.removeProperty("transform");
  }
}

function forceVisible(scope: HTMLElement, mode: "all" | "in-view") {
  scope.querySelectorAll<HTMLElement>(HIDDEN_MOTION).forEach((element) => {
    if (mode === "in-view" && !inFirstScreen(element)) {
      return;
    }
    if (!isHidden(element)) {
      return;
    }
    showElement(element);
  });
}

/** In-view motion nodes that never leave their hidden start state become visible. */
function armFailOpen(scope: HTMLElement): () => void {
  const timers = new Set<number>();
  const watch = scope.querySelectorAll<HTMLElement>(HIDDEN_MOTION);
  const later = (element: HTMLElement, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      if (isHidden(element)) {
        showElement(element);
      }
    }, delay);
    timers.add(timer);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) {
          return;
        }
        later(entry.target, 2600);
      });
    },
    { threshold: 0.2 },
  );
  watch.forEach((element) => observer.observe(element));
  laterTimeout(timers, () => forceVisible(scope, "in-view"), 3200);

  return () => {
    observer.disconnect();
    timers.forEach((timer) => window.clearTimeout(timer));
  };
}

function laterTimeout(timers: Set<number>, run: () => void, delay: number) {
  const timer = window.setTimeout(() => {
    timers.delete(timer);
    run();
  }, delay);
  timers.add(timer);
}
