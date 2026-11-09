/** Visible heading of the recommended-drinks list on a scene page. */
export type ListHeading = {
  /**
   * Lines of the h2, joined with a line break.
   * `{count}` is the number of kinds, drawn in the same mark as the shared heading.
   */
  lines?: readonly string[];
  /** Sentence under the heading. The shared heading has none. */
  lead?: string;
};

/**
 * Shared heading on every scene page that does not set `listHeading`.
 * The count sits in the second line: このN種類で.
 */
export const SHARED_LIST_HEADING_LINES = ["乾杯のソフトドリンクは、", "この{count}種類で"] as const;

export function resolveListHeading(heading?: ListHeading): { lines: readonly string[]; lead?: string } {
  const lines = heading?.lines && heading.lines.length > 0 ? heading.lines : SHARED_LIST_HEADING_LINES;
  return heading?.lead ? { lines, lead: heading.lead } : { lines };
}

/** Plain heading (line breaks removed) and lead, for checks. */
export function listHeadingText(heading: ListHeading | undefined, count: number): { heading: string; lead?: string } {
  const resolved = resolveListHeading(heading);
  const text = resolved.lines.map((line) => line.replaceAll("{count}", String(count))).join("");
  return resolved.lead ? { heading: text, lead: resolved.lead } : { heading: text };
}
