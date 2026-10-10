import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "../../cx";
import { JOURNEY, type JourneyStep } from "../../journey";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "inverse";
type ButtonIcon = "forward" | "back" | "external" | "none";

const GLYPH: Record<Exclude<ButtonIcon, "none">, string> = {
  forward: "M0 6h22M17 1l5 5-5 5",
  back: "M0 6h22M17 1l5 5-5 5",
  external: "M1 11 11 1M3 1h8v8",
};

type ButtonProps = {
  variant?: ButtonVariant;
  icon?: ButtonIcon;
  /** Large is the store call to action. */
  size?: "md" | "lg";
  /** Fill the width of the parent. */
  stretch?: boolean;
  /** Renders a link. Without it the button is a visual-only span, for use inside a larger link (e.g. a card). */
  href?: string;
  /** Motion: enters with the page intro. */
  intro?: boolean;
  /** The one store call to action on a drink page. */
  storePrimary?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  icon = "forward",
  size = "md",
  stretch = false,
  href,
  intro = false,
  storePrimary = false,
  children,
}: ButtonProps) {
  const className = cx(
    styles.button,
    styles[variant],
    (variant === "primary" || variant === "inverse") && styles.block,
    size === "lg" && styles.large,
    stretch && styles.stretch,
    icon === "back" && styles.back,
    icon === "external" && styles.external,
    icon === "none" && styles.noIcon,
  );

  const content = (
    <>
      <span>{children}</span>
      {icon === "none" ? null : (
        <span className={styles.icon} aria-hidden="true">
          <svg viewBox={icon === "external" ? "0 0 12 12" : "0 0 24 12"}>
            <path d={GLYPH[icon]} fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </span>
      )}
    </>
  );

  const storeMark = storePrimary ? ({ "data-store-primary": "true" } as const) : {};

  if (!href) {
    return (
      <span className={className} data-intro={intro || undefined} {...storeMark}>
        {content}
      </span>
    );
  }

  if (href.startsWith("https://") || href.startsWith("http://")) {
    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noopener nofollow"
        data-intro={intro || undefined}
        {...storeMark}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className} data-intro={intro || undefined} {...storeMark}>
      {content}
    </Link>
  );
}

type JourneyCtaProps = {
  to: JourneyStep;
  direction?: "forward" | "back";
  /** Surface the CTA sits on; back links adapt to it. */
  surface?: "light" | "inverse";
  intro?: boolean;
  children: ReactNode;
};

/** The only way pages link along 場 → 一杯. Forward is always the solid primary action. */
export function JourneyCta({ to, direction = "forward", surface = "light", intro = false, children }: JourneyCtaProps) {
  const href = JOURNEY[to].href;

  switch (direction) {
    case "forward":
      return (
        <Button variant="primary" href={href} intro={intro}>
          {children}
        </Button>
      );
    case "back":
      return (
        <Button variant={surface === "inverse" ? "inverse" : "secondary"} icon="back" href={href} intro={intro}>
          {children}
        </Button>
      );
    default: {
      const exhaustive: never = direction;
      return exhaustive;
    }
  }
}
