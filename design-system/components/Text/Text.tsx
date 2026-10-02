import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "../../cx";
import styles from "./Text.module.css";

export type TextVariant = "display" | "statement" | "headline" | "title" | "prose" | "lead" | "body" | "small" | "caption" | "mark";
export type TextTone = "primary" | "secondary" | "muted" | "accent" | "inverse" | "inverseMuted";
type TextTag = "h1" | "h2" | "h3" | "p" | "span" | "div";

type TextProps = {
  as?: TextTag;
  variant: TextVariant;
  tone?: TextTone;
  id?: string;
  intro?: boolean;
  children: ReactNode;
};

export function Text({ as: Tag = "p", variant, tone, id, intro = false, children }: TextProps) {
  return (
    <Tag id={id} className={cx(styles[variant], tone && styles[tone])} data-intro={intro || undefined}>
      {children}
    </Tag>
  );
}

type EyebrowProps = {
  tone?: "accent" | "inverse";
  id?: string;
  intro?: boolean;
  children: ReactNode;
};

export function Eyebrow({ tone = "accent", id, intro = false, children }: EyebrowProps) {
  return (
    <p id={id} className={cx(styles.eyebrow, tone === "inverse" && styles.eyebrowInverse)} data-intro={intro || undefined}>
      {children}
    </p>
  );
}

type NumeralProps = {
  size?: "md" | "lg";
  tone?: "accent" | "inverse";
  intro?: boolean;
  decorative?: boolean;
  children: ReactNode;
};

export function Numeral({ size = "lg", tone = "accent", intro = false, decorative = true, children }: NumeralProps) {
  return (
    <span
      className={cx(styles.numeral, size === "md" ? styles.numeralMd : styles.numeralLg, tone === "inverse" && styles.numeralInverse)}
      aria-hidden={decorative || undefined}
      data-intro={intro || undefined}
    >
      {children}
    </span>
  );
}

type DisplayLinesProps = {
  as?: "h1" | "h2";
  id?: string;
  variant?: "display" | "mark";
  lines: readonly string[];
};

/** Headline whose lines rise out of a mask on page load. */
export function DisplayLines({ as: Tag = "h1", id, variant = "display", lines }: DisplayLinesProps) {
  return (
    <Tag id={id} className={styles[variant]}>
      {lines.map((line) => (
        <span key={line} className={styles.line}>
          <span className={styles.lineInner} data-line>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}

type FillTextProps = {
  as?: "h2" | "p";
  id?: string;
  variant?: "statement" | "prose";
  lines: readonly string[];
};

/** Text that inks in character by character as it scrolls through the viewport. */
export function FillText({ as: Tag = "p", id, variant = "statement", lines }: FillTextProps) {
  return (
    <Tag id={id} className={styles[variant]} data-fill>
      <span className={styles.srOnly}>{lines.join("")}</span>
      <span aria-hidden="true">
        {lines.map((line) => (
          <span key={line} className={styles.fillLine}>
            {Array.from(line).map((char, index) => (
              <span key={index} data-fill-char>
                {char}
              </span>
            ))}
          </span>
        ))}
      </span>
    </Tag>
  );
}

/** Keeps a Japanese phrase on one line; the browser breaks between phrases only. */
export function Phrase({ children }: { children: ReactNode }) {
  return <span className={styles.phrase}>{children}</span>;
}

export function TextLink({ href, external = false, children }: { href: string; external?: boolean; children: ReactNode }) {
  if (external) {
    return (
      <a href={href} className={styles.link} rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={styles.link}>
      {children}
    </Link>
  );
}
