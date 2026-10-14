export type JourneyStep = "ba" | "drink";

export const JOURNEY = {
  ba: { no: "01", label: "飲み会", href: "/ba/office/" },
  drink: { no: "02", label: "ドリンク", href: "/drink/kimino-yuzu/" },
} as const satisfies Record<JourneyStep, { no: string; label: string; href: string }>;

export const JOURNEY_ORDER: readonly JourneyStep[] = ["ba", "drink"];
