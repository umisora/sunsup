import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "solid" | "ghost";

function Inner({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="cta__label">{children}</span>
      <span className="cta__icon" aria-hidden="true">
        <svg viewBox="0 0 24 12">
          <path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </span>
    </>
  );
}

function ctaClass(tone: Tone): string {
  return tone === "ghost" ? "cta cta--ghost" : "cta";
}

export function JourneyLink({
  href,
  tone = "solid",
  children,
}: {
  href: string;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={ctaClass(tone)}>
      <Inner>{children}</Inner>
    </Link>
  );
}

export function JourneyMark({ children }: { children: ReactNode }) {
  return (
    <span className="cta">
      <Inner>{children}</Inner>
    </span>
  );
}
