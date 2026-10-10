import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "../../cx";
import layout from "../Layout/Layout.module.css";
import styles from "./ProductHero.module.css";

export type Crumb = { href: string; label: string };

type ProductHeroProps = {
  id: string;
  crumbs: readonly Crumb[];
  title: ReactNode;
  /** One quiet line under the name, e.g. the size. */
  meta?: ReactNode;
  /** Collection number, set in the corner like a catalog plate. */
  folio?: string;
  /** The drink's own still in a plinth <StillLife>. Omitted when the drink has none: the hero is type only. */
  media?: ReactNode;
  /** The store slot. */
  children?: ReactNode;
  /** Quiet actions under the store, e.g. saving the drink. */
  extra?: ReactNode;
};

/** Top of a drink page: the still on its plinth beside the name and the way to the store. */
export function ProductHero({ id, crumbs, title, meta, folio, media, children, extra }: ProductHeroProps) {
  return (
    <section className={cx(layout.wrap, styles.hero, !media && styles.textOnly)} aria-labelledby={id}>
      {media ? <div className={styles.media}>{media}</div> : null}
      <div className={styles.body}>
        <div className={styles.top} data-intro>
          <nav aria-label="現在地">
            <ol className={styles.crumbs}>
              {crumbs.map((crumb) => (
                <li key={crumb.href}>
                  <Link href={crumb.href} className={styles.crumb}>
                    {crumb.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          {folio ? <p className={styles.folio}>{folio}</p> : null}
        </div>
        <h1 id={id} className={styles.title} data-intro>
          {title}
        </h1>
        {meta ? (
          <p className={styles.meta} data-intro>
            {meta}
          </p>
        ) : null}
        {children ? <div className={styles.action}>{children}</div> : null}
        {extra ? <div className={styles.extra}>{extra}</div> : null}
      </div>
    </section>
  );
}

type Fact = { key: string; no: string; title: string; body: ReactNode };

/** The four axes of a drink as an editorial list: numeral, label, then the sentence in Mincho. */
export function FactList({ facts, label }: { facts: readonly Fact[]; label: string }) {
  return (
    <dl className={styles.facts} aria-label={label}>
      {facts.map((fact) => (
        <div key={fact.key} className={styles.fact} data-reveal>
          <dt className={styles.factHead}>
            <span className={styles.factNo} aria-hidden="true">
              {fact.no}
            </span>
            {fact.title}
          </dt>
          <dd className={styles.factBody}>{fact.body}</dd>
        </div>
      ))}
    </dl>
  );
}
