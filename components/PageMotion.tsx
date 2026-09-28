"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type MotionKind = "home" | "office" | "shell";

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
        revealRises(scope);
        revealAxes(scope);
        animateKind(kind, scope);
      });

      const onLoad = () => {
        ScrollTrigger.refresh();
      };
      window.addEventListener("load", onLoad);

      return () => {
        window.removeEventListener("load", onLoad);
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
  const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });
  const mark = scope.querySelector(".glass-mark");
  const rule = scope.querySelector(".hero-copy .brass-rule");
  const lines = scope.querySelectorAll(".hero-copy .enter");

  if (mark) {
    timeline.fromTo(
      mark,
      { scaleX: 0.55, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.7, transformOrigin: "center center" },
      0,
    );
  }

  if (rule) {
    timeline.fromTo(
      rule,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.75, transformOrigin: "left center" },
      0.05,
    );
  }

  if (lines.length > 0) {
    timeline.from(lines, { y: 14, duration: 0.85, stagger: 0.08, clearProps: "transform" }, 0.12);
  }
}

function revealRises(scope: HTMLElement) {
  scope.querySelectorAll<HTMLElement>(".rise").forEach((element) => {
    gsap.from(element, {
      y: 28,
      duration: 0.9,
      ease: "power2.out",
      immediateRender: false,
      scrollTrigger: {
        trigger: element,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });
  });
}

function revealAxes(scope: HTMLElement) {
  const axes = scope.querySelector(".axes");
  const items = scope.querySelectorAll(".axis");
  if (!axes || items.length === 0) {
    return;
  }

  gsap.from(items, {
    y: 20,
    duration: 0.75,
    stagger: 0.08,
    ease: "power2.out",
    immediateRender: false,
    scrollTrigger: {
      trigger: axes,
      start: "top 86%",
      toggleActions: "play none none none",
    },
  });
}

function animateKind(kind: MotionKind, scope: HTMLElement) {
  switch (kind) {
    case "home":
      scrubGlass(scope, -16);
      return;
    case "office":
      scrubGlass(scope, -12);
      playCtaBand(scope);
      return;
    case "shell": {
      const scene = scope.querySelector(".hero-scene");
      if (scene) {
        gsap.from(scene, { y: 18, duration: 1.05, ease: "power2.out", clearProps: "transform" });
      }
      scrubGlass(scope, -10);
      return;
    }
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function scrubGlass(scope: HTMLElement, distance: number) {
  const scene = scope.querySelector(".hero-scene");
  const glass = scene?.querySelector(".still-glass");
  if (!scene || !glass) {
    return;
  }

  gsap.to(glass, {
    y: distance,
    ease: "none",
    scrollTrigger: {
      trigger: scene,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.7,
    },
  });
}

function playCtaBand(scope: HTMLElement) {
  const band = scope.querySelector(".cta-band");
  const rule = band?.querySelector(".brass-rule");
  if (!band || !rule) {
    return;
  }

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: band,
      start: "top 82%",
      toggleActions: "play none none none",
    },
  });

  timeline
    .from(band, { y: 24, duration: 0.85, ease: "power2.out", immediateRender: false })
    .fromTo(
      rule,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.65, ease: "power2.out", transformOrigin: "left center" },
      "<0.12",
    );
}
