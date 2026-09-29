"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/ba/office", label: "場" },
  { href: "/about", label: "運営" },
] as const;

function normalize(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export function SiteHeader() {
  const pathname = normalize(usePathname() ?? "/");

  return (
    <header className="site-header">
      <div className="wrap site-header__bar">
        <Link href="/" className="mark" aria-current={pathname === "/" ? "page" : undefined}>
          sunsup
        </Link>
        <nav aria-label="サイト">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
