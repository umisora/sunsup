import Link from "next/link";
import type { ReactNode } from "react";

function Inner({ children }: { children: ReactNode }) {
  return (
    <>
      <span>{children}</span>
      <svg className="cta__arrow" viewBox="0 0 24 12" aria-hidden="true">
        <path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </>
  );
}

export function JourneyLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="cta">
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
