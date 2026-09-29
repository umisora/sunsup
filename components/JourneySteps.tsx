import Link from "next/link";

type Step = "ba" | "drink";

const STEPS = [
  { id: "ba", no: "01", label: "場", href: "/ba/office" },
  { id: "drink", no: "02", label: "一杯", href: "/drink/shell" },
] as const satisfies readonly { id: Step; no: string; label: string; href: string }[];

export function JourneySteps({ current }: { current: Step }) {
  return (
    <nav className="steps" aria-label="旅の位置" data-intro>
      <ol>
        {STEPS.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className="steps__item"
              aria-current={step.id === current ? "step" : undefined}
            >
              <span className="steps__no">{step.no}</span>
              <span>{step.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
