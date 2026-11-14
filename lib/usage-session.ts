/**
 * Per-pathname marks for the bottle-count table and the shopping-list headcount.
 * Reset when the path changes. PostHog capture itself still goes through lib/web-analytics.ts.
 */
import { DEFAULT_HEADCOUNT, MAX_HEADCOUNT, MIN_HEADCOUNT, SET_ROLES, type SetRole } from "./shopping-list";
import {
  captureCountTableView,
  captureHeadcountChange,
  captureListShare,
  type AnalyticsViewport,
  type HeadcountMethod,
  type ListShareMethod,
} from "./web-analytics";

export const HEADCOUNT_DEBOUNCE_MS = 1500;

const VENUE_PATH = /^\/ba\/([a-z0-9][a-z0-9-]{0,80})\/?$/;
const NARROW_QUERY = "(max-width: 767px)";

export type HeadcountInput = "step_up" | "step_down" | "type";

export interface UsageSnapshot {
  headcount: number;
  headcountChanged: boolean;
  countTableViewed: boolean;
  tableOnPage: boolean;
  changeIndex: number;
}

export interface OutboundUsage {
  headcount?: number;
  headcountChanged: boolean;
  countTableViewed: boolean;
  role?: SetRole;
  viewport: AnalyticsViewport;
}

type PendingChange = {
  from: number;
  to: number;
  methods: Set<HeadcountInput>;
  timer: ReturnType<typeof setTimeout> | null;
};

let path = "";
let headcount = DEFAULT_HEADCOUNT;
let headcountChanged = false;
let countTableViewed = false;
let tableOnPage = false;
let changeIndex = 0;
let pending: PendingChange | null = null;

export function venueFromPath(pagePath: string): string | undefined {
  return VENUE_PATH.exec(pagePath)?.[1];
}

export function currentViewport(): AnalyticsViewport {
  try {
    if (typeof matchMedia === "function" && matchMedia(NARROW_QUERY).matches) {
      return "narrow";
    }
  } catch {
    return "wide";
  }
  return "wide";
}

/** Same path is a no-op, so a re-render does not wipe a gesture that is still open. */
export function resetUsageSession(nextPath: string): void {
  if (!nextPath || nextPath === path) {
    return;
  }
  if (pending?.timer !== null && pending?.timer !== undefined) {
    clearTimeout(pending.timer);
  }
  pending = null;
  path = nextPath;
  headcount = DEFAULT_HEADCOUNT;
  headcountChanged = false;
  countTableViewed = false;
  tableOnPage = false;
  changeIndex = 0;
}

export function readUsage(): UsageSnapshot {
  return { headcount, headcountChanged, countTableViewed, tableOnPage, changeIndex };
}

export function setTableOnPage(on: boolean): void {
  tableOnPage = on;
}

export function noteHeadcount(next: number, method: HeadcountInput): void {
  if (!Number.isInteger(next) || next < MIN_HEADCOUNT || next > MAX_HEADCOUNT) {
    return;
  }
  if (!pending) {
    if (next === headcount) {
      return;
    }
    pending = { from: headcount, to: next, methods: new Set([method]), timer: null };
  } else {
    pending.to = next;
    pending.methods.add(method);
    if (pending.timer !== null) {
      clearTimeout(pending.timer);
      pending.timer = null;
    }
  }
  headcount = next;
  pending.timer = setTimeout(() => {
    flushHeadcountChange();
  }, HEADCOUNT_DEBOUNCE_MS);
}

/** Send the open gesture. A gesture that ends where it started is dropped. */
export function flushHeadcountChange(): void {
  if (!pending) {
    return;
  }
  if (pending.timer !== null) {
    clearTimeout(pending.timer);
  }
  const finished = pending;
  pending = null;
  if (finished.from === finished.to) {
    return;
  }
  changeIndex += 1;
  headcountChanged = true;
  const venue = venueFromPath(path);
  if (!venue) {
    return;
  }
  captureHeadcountChange({
    venue,
    headcountFrom: finished.from,
    headcountTo: finished.to,
    method: combineMethods(finished.methods),
    changeIndex,
    tableOnPage,
    viewport: currentViewport(),
  });
}

export function shareList(method: ListShareMethod): void {
  flushHeadcountChange();
  const venue = venueFromPath(path);
  if (!venue) {
    return;
  }
  captureListShare({
    venue,
    method,
    headcount,
    headcountChanged,
    viewport: currentViewport(),
  });
}

/** Once per path. Safe to call again after the table crosses 50% a second time. */
export function viewCountTable(): void {
  if (countTableViewed) {
    return;
  }
  const venue = venueFromPath(path);
  if (!venue) {
    return;
  }
  countTableViewed = true;
  captureCountTableView({ venue, viewport: currentViewport() });
}

/** headcount is attached only for a shopping-list link. Unknown roles are omitted. */
export function outboundUsageProps(source: string | undefined, role: string | null | undefined): OutboundUsage {
  return {
    headcount: source === "list" ? headcount : undefined,
    headcountChanged,
    countTableViewed,
    role: knownRole(role),
    viewport: currentViewport(),
  };
}

function combineMethods(methods: ReadonlySet<HeadcountInput>): HeadcountMethod {
  const [only] = methods;
  if (methods.size !== 1 || only === undefined) {
    return "mixed";
  }
  switch (only) {
    case "step_up":
    case "step_down":
    case "type":
      return only;
    default: {
      const unexpected: never = only;
      return unexpected;
    }
  }
}

function knownRole(value: string | null | undefined): SetRole | undefined {
  for (const role of SET_ROLES) {
    if (role === value) {
      return role;
    }
  }
  return undefined;
}
