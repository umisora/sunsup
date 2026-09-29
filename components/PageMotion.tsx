"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type MotionKind = "home" | "office" | "shell" | "about";

type PageMotionProps = {
  kind: MotionKind;
  children: ReactNode;
};

export function PageMotion({ kind, children }: PageMotionProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope) {
        return;
      }

      const mm = gsap.matchMedia();
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 768px)" },
        (context) => {
          const { motion, wide } = context.conditions ?? {};
          if (!motion) {
            return;
          }
          playIntro(scope);
          // ScrollTriggers are created top-to-bottom so the shell pin spacer is measured before later triggers.
          animateKind(kind, scope, Boolean(wide));
          driftPhotos(scope);
          revealOnScroll(scope);
        },
      );

      const refresh = () => ScrollTrigger.refresh();
      const pending = Array.from(scope.querySelectorAll("img")).filter((img) => !img.complete);
      pending.forEach((img) => img.addEventListener("load", refresh, { once: true }));

      return () => {
        pending.forEach((img) => img.removeEventListener("load", refresh));
        mm.revert();
      };
    },
    { scope: root, dependencies: [kind], revertOnUpdate: true },
  );

  return (
    <div ref={root} data-motion={kind}>
      {children}
    </div>
  );
}

function playIntro(scope: HTMLElement) {
  const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
  const media = scope.querySelector("[data-intro-media]");
  const lines = scope.querySelectorAll("[data-line]");
  const items = scope.querySelectorAll("[data-intro]");

  timeline.addLabel("media", 0).addLabel("type", media ? 0.5 : 0.1);

  if (media) {
    timeline.fromTo(
      media,
      { clipPath: "inset(0% 0% 100% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "power3.inOut" },
      "media",
    );
    const image = media.querySelector("img");
    if (image) {
      timeline.fromTo(image, { scale: 1.14 }, { scale: 1, duration: 2.2 }, "media");
    }
  }

  if (lines.length > 0) {
    timeline.fromTo(
      lines,
      { yPercent: 105, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 1.1, stagger: 0.12 },
      "type",
    );
  }

  if (items.length > 0) {
    timeline.fromTo(
      items,
      { y: 18, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08 },
      "type+=0.2",
    );
  }
}

function driftPhotos(scope: HTMLElement) {
  scope.querySelectorAll<HTMLElement>("[data-parallax]").forEach((frame) => {
    const image = frame.querySelector("img");
    if (!image) {
      return;
    }
    gsap.fromTo(
      image,
      { yPercent: -5 },
      {
        yPercent: 5,
        ease: "none",
        scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });

  scope.querySelectorAll<HTMLElement>("[data-drift]").forEach((element) => {
    gsap.to(element, {
      y: -72,
      ease: "none",
      scrollTrigger: {
        trigger: element.closest("section") ?? element,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  });
}

function revealOnScroll(scope: HTMLElement) {
  scope.querySelectorAll<HTMLElement>("[data-fill]").forEach((element) => {
    const chars = element.querySelectorAll(".fill__char");
    gsap.fromTo(
      chars,
      { opacity: 0.2 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.05,
        scrollTrigger: { trigger: element, start: "top 82%", end: "bottom 48%", scrub: 0.6 },
      },
    );
  });

  scope.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
    gsap.fromTo(
      element,
      { y: 36, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: element, start: "top 86%", once: true },
      },
    );
  });

  // Journey CTAs stay visible and clickable at all times; they only slide.
  scope.querySelectorAll<HTMLElement>("[data-rise]").forEach((element) => {
    gsap.from(element, {
      y: 56,
      duration: 1.2,
      ease: "power3.out",
      immediateRender: false,
      scrollTrigger: { trigger: element, start: "top 92%", once: true },
    });
  });

  const items = gsap.utils.toArray<HTMLElement>("[data-stagger-item]", scope);
  if (items.length > 0) {
    gsap.set(items, { y: 40, autoAlpha: 0 });
    ScrollTrigger.batch(items, {
      start: "top 90%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          y: 0,
          autoAlpha: 1,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
          overwrite: true,
        }),
    });
  }
}

function animateKind(kind: MotionKind, scope: HTMLElement, wide: boolean) {
  switch (kind) {
    case "home":
    case "office":
    case "about":
      return;
    case "shell":
      openPeak(scope, wide);
      return;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
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
    defaults: { ease: "none" },
    scrollTrigger: wide
      ? { trigger: stage, start: "top top", end: "+=90%", pin: true, scrub: 0.8, anticipatePin: 1 }
      : { trigger: stage, start: "top 85%", end: "top 15%", scrub: 0.6 },
  });

  timeline
    .fromTo(frame, { clipPath: inset }, { clipPath: "inset(0% 0% 0% 0% round 0px)" }, 0)
    .fromTo(image, { scale: 1.16 }, { scale: 1 }, 0)
    .fromTo(copy, { y: 56 }, { y: 0 }, 0.1);
}
