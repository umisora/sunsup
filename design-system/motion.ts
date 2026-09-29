/**
 * GSAP-side motion tokens. CSS-side durations/easings live in styles/tokens.css.
 * Attribute contract (set by components, read by <Motion>) is documented in docs/design-system.md.
 */
export const motion = {
  ease: {
    enter: "power3.out",
    reveal: "power3.inOut",
    scrub: "none",
  },
  duration: {
    mediaReveal: 1.5,
    mediaSettle: 2.2,
    line: 1.1,
    item: 0.9,
    card: 1,
    rise: 1.2,
  },
  stagger: {
    line: 0.12,
    item: 0.08,
    card: 0.1,
    char: 0.05,
  },
  distance: {
    intro: 18,
    reveal: 36,
    card: 40,
    rise: 56,
    drift: -72,
    parallax: 5,
  },
  scrub: {
    fill: 0.6,
    peak: 0.8,
    peakNarrow: 0.6,
  },
} as const;
