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
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        playIntro(scope);
        revealOnScroll(scope);
        driftPhotos(scope);
        animateKind(kind, scope);
      });

      const refresh = () => ScrollTrigger.refresh();
      const pending = Array.from(scope.querySelectorAll("img")).filter((img) => !img.complete);
      pending.forEach((img) => img.addEventListener("load", refresh));

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

  if (media) {
    timeline.fromTo(
      media,
      { clipPath: "inset(0% 0% 100% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "power3.inOut" },
      0,
    );
    const image = media.querySelector("img");
    if (image) {
      timeline.fromTo(image, { scale: 1.14 }, { scale: 1, duration: 2.2 }, 0);
    }
  }

  if (lines.length > 0) {
    timeline.fromTo(
      lines,
      { yPercent: 105, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 1.1, stagger: 0.12 },
      media ? 0.55 : 0.1,
    );
  }

  if (items.length > 0) {
    timeline.fromTo(
      items,
      { y: 18, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08 },
      media ? 0.75 : 0.25,
    );
  }
}

function revealOnScroll(scope: HTMLElement) {
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
      y: 48,
      duration: 1.2,
      ease: "power3.out",
      immediateRender: false,
      scrollTrigger: { trigger: element, start: "top 92%", once: true },
    });
  });

  scope.querySelectorAll<HTMLElement>("[data-stagger]").forEach((group) => {
    const items = group.querySelectorAll("[data-stagger-item]");
    if (items.length === 0) {
      return;
    }
    gsap.fromTo(
      items,
      { y: 28, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: group, start: "top 82%", once: true },
      },
    );
  });

  scope.querySelectorAll<HTMLElement>("[data-rule]").forEach((rule) => {
    gsap.fromTo(
      rule,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.2,
        ease: "power2.inOut",
        transformOrigin: "left center",
        scrollTrigger: { trigger: rule, start: "top 90%", once: true },
      },
    );
  });
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
}

function animateKind(kind: MotionKind, scope: HTMLElement) {
  switch (kind) {
    case "home":
    case "office":
    case "about":
      return;
    case "shell":
      settlePeak(scope);
      return;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function settlePeak(scope: HTMLElement) {
  const peak = scope.querySelector(".peak");
  const image = scope.querySelector(".peak__media img");
  if (!peak || !image) {
    return;
  }

  gsap.fromTo(
    image,
    { objectPosition: "50% 30%" },
    {
      objectPosition: "50% 70%",
      ease: "none",
      scrollTrigger: { trigger: peak, start: "top top", end: "bottom bottom", scrub: 0.6 },
    },
  );
}
