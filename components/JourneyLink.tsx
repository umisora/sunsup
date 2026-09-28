import Link from "next/link";
import type { ReactNode } from "react";

type JourneyLinkProps = {
  href: string;
  children: ReactNode;
};

export function JourneyLink({ href, children }: JourneyLinkProps) {
  return (
    <Link href={href} className="journey">
      <span className="journey__bar" aria-hidden="true" />
      {children}
    </Link>
  );
}
