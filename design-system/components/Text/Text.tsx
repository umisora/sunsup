import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "../../cx";
import styles from "./Text.module.css";

const SOFT_BOUNDARY =
  /(?<=[\u3040-\u30ff\u3400-\u9fff々ー])(?=[A-Za-z0-9])|(?<=[A-Za-z0-9])(?=[\u3040-\u30ff\u3400-\u9fff々ー])/u;

/** Break opportunities at spaces and between Japanese and Latin. The words stay the same. */
export function SoftBreak({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  text.split(/(\s+)/).forEach((token, index) => {
    if (token.length === 0) {
      return;
    }
    if (/^\s+$/.test(token)) {
      nodes.push(token);
      nodes.push(<wbr key={`space-${index}`} />);
      return;
    }
    token.split(SOFT_BOUNDARY).forEach((bit, bitIndex) => {
      if (bitIndex > 0) {
        nodes.push(<wbr key={`break-${index}-${bitIndex}`} />);
      }
      nodes.push(bit);
    });
  });
  return nodes;
}

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
  /** `tate` sets the lines vertically (縦書き), right to left. */
  variant?: "display" | "mark" | "tate";
  lines: readonly string[];
};

/** Headline whose lines rise out of a mask on page load. */
export function DisplayLines({ as: Tag = "h1", id, variant = "display", lines }: DisplayLinesProps) {
  return (
    <Tag id={id} className={styles[variant]}>
      {lines.map((line) => (
        <span key={line} className={styles.line}>
          <span className={styles.lineInner} data-line>
            <SoftBreak text={line} />
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
      <a href={href} className={styles.link} target="_blank" rel="noopener nofollow">
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
