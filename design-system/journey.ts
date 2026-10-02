export type JourneyStep = "ba" | "drink";

export const JOURNEY = {
  ba: { no: "01", label: "場", href: "/ba/office" },
  drink: { no: "02", label: "一杯", href: "/drink/shell" },
} as const satisfies Record<JourneyStep, { no: string; label: string; href: string }>;

export const JOURNEY_ORDER: readonly JourneyStep[] = ["ba", "drink"];
