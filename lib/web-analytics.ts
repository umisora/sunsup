import type { CaptureResult, PostHogConfig } from "posthog-js";
import { MAX_HEADCOUNT, MIN_HEADCOUNT, SET_ROLES } from "./shopping-list";

/**
 * Anonymous pageviews and shop-link clicks for https://stylish.sunsup.me only.
 * The SDK is initialized from instrumentation-client.ts after this module
 * accepts the hostname and the build-time ingestion settings.
 */

export const PRODUCTION_HOSTNAME = "stylish.sunsup.me";
export const QA_QUERY_PARAM = "analytics_qa";
export const QA_STORAGE_KEY = "analytics_qa";
export const PAGEVIEW_EVENT = "$pageview";
export const OUTBOUND_CLICK_EVENT = "outbound_click";
export const COUNT_TABLE_VIEW_EVENT = "count_table_view";
export const HEADCOUNT_CHANGE_EVENT = "headcount_change";
export const LIST_SHARE_EVENT = "list_share";
const DIRECT = "$direct";
const INSTALLED_FLAG = "__stylishWebAnalytics";
const SLUG = /^[a-z0-9][a-z0-9-]{0,80}$/;
const HOSTNAME = /^[A-Za-z0-9.-]{1,253}$/;
const PATH = /^\/[A-Za-z0-9/_-]{0,200}$/;
const OUT_SHOPS = new Set(["amazon", "rakuten", "direct", "other", "official"]);
const OUT_SOURCES = new Set(["page", "list"]);
const VIEWPORTS = new Set(["narrow", "wide"]);
const HEADCOUNT_METHODS = new Set(["step_up", "step_down", "type", "mixed"]);
const SHARE_METHODS = new Set(["line", "copy"]);
const LIST_ROLES = new Set<string>(SET_ROLES);
const MAX_CHANGE_INDEX = 999;

/** Official PostHog Cloud ingestion hosts. The active host still comes from env. */
const OFFICIAL_INGESTION_HOSTS = new Set(["https://eu.i.posthog.com", "https://us.i.posthog.com"]);
const PROJECT_TOKEN = /^phc_[A-Za-z0-9]{16,}$/;
const ANONYMOUS_ID = /^[A-Za-z0-9_-]{8,128}$/;

/**
 * Fields kept on a $pageview. Everything else the SDK adds — user agent,
 * campaign params, initial URL copies, device/screen data — is removed.
 */
export const ESSENTIAL_EVENT_PROPERTIES = [
  "token",
  "distinct_id",
  "analytics_qa",
  "$current_url",
  "$pathname",
  "$host",
  "$referrer",
  "$referring_domain",
  "$session_id",
  "$window_id",
  "$pageview_id",
  "$insert_id",
  "$lib",
  "$lib_version",
  "$time",
  "$process_person_profile",
  "$is_identified",
] as const;

/**
 * Extra fields kept on an outbound_click. Shared SDK fields still come from ESSENTIAL_EVENT_PROPERTIES.
 * headcount is only present for a list link. City, IP, postal code, and coordinates are never listed.
 */
export const OUTBOUND_CLICK_PROPERTIES = [
  "shop",
  "host",
  "drink_slug",
  "path",
  "venue",
  "position",
  "source",
  "headcount",
  "headcount_changed",
  "count_table_viewed",
  "role",
  "viewport",
] as const;

export const COUNT_TABLE_VIEW_PROPERTIES = ["venue", "viewport"] as const;

export const HEADCOUNT_CHANGE_PROPERTIES = [
  "venue",
  "headcount_from",
  "headcount_to",
  "method",
  "change_index",
  "table_on_page",
  "viewport",
] as const;

export const LIST_SHARE_PROPERTIES = ["venue", "method", "headcount", "headcount_changed", "viewport"] as const;

export type AnalyticsViewport = "narrow" | "wide";
export type HeadcountMethod = "step_up" | "step_down" | "type" | "mixed";
export type ListShareMethod = "line" | "copy";

export interface OutboundClickDetail {
  shop: string;
  host: string;
  drinkSlug: string;
  path: string;
  venue?: string;
  position: number;
  source?: string;
  /** Present only for a link inside the shopping list. Integer 1–200. */
  headcount?: number;
  headcountChanged?: boolean;
  countTableViewed?: boolean;
  role?: string;
  viewport?: AnalyticsViewport;
}

export interface CountTableViewDetail {
  venue: string;
  viewport: AnalyticsViewport;
}

export interface HeadcountChangeDetail {
  venue: string;
  headcountFrom: number;
  headcountTo: number;
  method: HeadcountMethod;
  changeIndex: number;
  tableOnPage: boolean;
  viewport: AnalyticsViewport;
}

export interface ListShareDetail {
  venue: string;
  method: ListShareMethod;
  headcount: number;
  headcountChanged: boolean;
  viewport: AnalyticsViewport;
}

export interface IngestionEnv {
  token?: string;
  host?: string;
}

export interface IngestionConfig {
  token: string;
  host: string;
}

export interface QaStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface AnalyticsScope {
  location: { hostname: string; search: string; href?: string };
  sessionStorage?: QaStorage;
}

export interface AnalyticsClient {
  init(token: string, config?: Partial<PostHogConfig>): void;
  capture(event: string, properties?: Record<string, unknown>): void;
}

/** Set while PostHog is live on the production hostname; null everywhere else. */
let activeClient: AnalyticsClient | null = null;
/** True only after this document has accepted the production hostname and ingestion config. */
let analyticsWillStart = false;
/** One table view that happened before the SDK chunk finished loading. */
let pendingCountTableView: { venue: string; viewport: AnalyticsViewport } | null = null;

interface AnalyticsTarget extends AnalyticsScope {
  [INSTALLED_FLAG]?: boolean;
}

export function shouldCaptureHostname(hostname: string): boolean {
  return hostname === PRODUCTION_HOSTNAME;
}

export function resolveIngestionConfig(env: IngestionEnv): IngestionConfig | null {
  const token = env.token?.trim() ?? "";
  const host = (env.host?.trim() ?? "").replace(/\/+$/, "");
  if (!PROJECT_TOKEN.test(token) || !OFFICIAL_INGESTION_HOSTS.has(host)) {
    return null;
  }
  return { token, host };
}

export function rememberAnalyticsQa(search: string, storage: QaStorage): boolean {
  try {
    if (storage.getItem(QA_STORAGE_KEY) === "1") {
      return true;
    }
    const value = new URLSearchParams(search).get(QA_QUERY_PARAM);
    if (value !== null && /^(1|true)$/i.test(value)) {
      storage.setItem(QA_STORAGE_KEY, "1");
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function sanitizeCapturedPageview(
  event: CaptureResult,
  context: { search: string; storage: QaStorage },
): CaptureResult | null {
  if (event.event !== PAGEVIEW_EVENT || !event.properties) {
    return null;
  }
  return sanitizeAnonymousEvent(event, context, (properties, qa) => {
    const current = sanitizeHttpUrl(properties.$current_url);
    if (!current || current.hostname !== PRODUCTION_HOSTNAME) {
      return null;
    }
    const referrer = sanitizeReferrer(properties.$referrer);
    const next: Record<string, unknown> = {
      $current_url: current.href,
      $pathname: current.pathname,
      $host: current.hostname,
      $referrer: referrer.href,
      $referring_domain: referrer.domain,
      analytics_qa: qa,
      $process_person_profile: false,
      $is_identified: false,
    };
    return next;
  });
}

export function sanitizeCapturedOutboundClick(
  event: CaptureResult,
  context: { search: string; storage: QaStorage },
): CaptureResult | null {
  if (event.event !== OUTBOUND_CLICK_EVENT || !event.properties) {
    return null;
  }
  return sanitizeAnonymousEvent(event, context, (properties, qa) => {
    const shop = properties.shop;
    const host = properties.host;
    const drinkSlug = properties.drink_slug;
    const path = properties.path;
    const position = properties.position;
    if (typeof shop !== "string" || !OUT_SHOPS.has(shop)) {
      return null;
    }
    if (typeof host !== "string" || !HOSTNAME.test(host) || host.includes("..")) {
      return null;
    }
    if (typeof drinkSlug !== "string" || !SLUG.test(drinkSlug)) {
      return null;
    }
    if (typeof path !== "string" || !PATH.test(path)) {
      return null;
    }
    if (typeof position !== "number" || !Number.isInteger(position) || position < 0 || position > 999) {
      return null;
    }
    const next: Record<string, unknown> = {
      shop,
      host,
      drink_slug: drinkSlug,
      path,
      position,
      analytics_qa: qa,
      $process_person_profile: false,
      $is_identified: false,
    };
    const venue = properties.venue;
    if (typeof venue === "string") {
      if (!SLUG.test(venue)) {
        return null;
      }
      next.venue = venue;
    }
    const source = properties.source;
    if (typeof source === "string") {
      if (!OUT_SOURCES.has(source)) {
        return null;
      }
      next.source = source;
    }
    const headcount = readOptionalHeadcount(properties.headcount);
    const headcountChanged = readOptionalBool(properties.headcount_changed);
    const countTableViewed = readOptionalBool(properties.count_table_viewed);
    const role = readOptionalChoice(properties.role, LIST_ROLES);
    const viewport = readOptionalChoice(properties.viewport, VIEWPORTS);
    if (headcount === null || headcountChanged === null || countTableViewed === null || role === null || viewport === null) {
      return null;
    }
    if (headcount !== undefined) {
      if (next.source !== "list") {
        return null;
      }
      next.headcount = headcount;
    }
    if (headcountChanged !== undefined) {
      next.headcount_changed = headcountChanged;
    }
    if (countTableViewed !== undefined) {
      next.count_table_viewed = countTableViewed;
    }
    if (role !== undefined) {
      next.role = role;
    }
    if (viewport !== undefined) {
      next.viewport = viewport;
    }
    return next;
  });
}

function sanitizeCapturedCountTableView(
  event: CaptureResult,
  context: { search: string; storage: QaStorage },
): CaptureResult | null {
  if (event.event !== COUNT_TABLE_VIEW_EVENT || !event.properties) {
    return null;
  }
  return sanitizeAnonymousEvent(event, context, (properties, qa) => {
    const venue = readVenue(properties.venue);
    const viewport = readRequiredChoice(properties.viewport, VIEWPORTS);
    if (!venue || !viewport) {
      return null;
    }
    return { venue, viewport, analytics_qa: qa, $process_person_profile: false, $is_identified: false };
  });
}

function sanitizeCapturedHeadcountChange(
  event: CaptureResult,
  context: { search: string; storage: QaStorage },
): CaptureResult | null {
  if (event.event !== HEADCOUNT_CHANGE_EVENT || !event.properties) {
    return null;
  }
  return sanitizeAnonymousEvent(event, context, (properties, qa) => {
    const venue = readVenue(properties.venue);
    const from = readRequiredHeadcount(properties.headcount_from);
    const to = readRequiredHeadcount(properties.headcount_to);
    const method = readRequiredChoice(properties.method, HEADCOUNT_METHODS);
    const changeIndex = readChangeIndex(properties.change_index);
    const tableOnPage = readRequiredBool(properties.table_on_page);
    const viewport = readRequiredChoice(properties.viewport, VIEWPORTS);
    if (!venue || from === null || to === null || from === to || !method || changeIndex === null || tableOnPage === null || !viewport) {
      return null;
    }
    return {
      venue,
      headcount_from: from,
      headcount_to: to,
      method,
      change_index: changeIndex,
      table_on_page: tableOnPage,
      viewport,
      analytics_qa: qa,
      $process_person_profile: false,
      $is_identified: false,
    };
  });
}

function sanitizeCapturedListShare(
  event: CaptureResult,
  context: { search: string; storage: QaStorage },
): CaptureResult | null {
  if (event.event !== LIST_SHARE_EVENT || !event.properties) {
    return null;
  }
  return sanitizeAnonymousEvent(event, context, (properties, qa) => {
    const venue = readVenue(properties.venue);
    const method = readRequiredChoice(properties.method, SHARE_METHODS);
    const headcount = readRequiredHeadcount(properties.headcount);
    const headcountChanged = readRequiredBool(properties.headcount_changed);
    const viewport = readRequiredChoice(properties.viewport, VIEWPORTS);
    if (!venue || !method || headcount === null || headcountChanged === null || !viewport) {
      return null;
    }
    return {
      venue,
      method,
      headcount,
      headcount_changed: headcountChanged,
      viewport,
      analytics_qa: qa,
      $process_person_profile: false,
      $is_identified: false,
    };
  });
}

/** before_send entry: keep only the events this site means to send. */
export function sanitizeCapturedEvent(
  event: CaptureResult,
  context: { search: string; storage: QaStorage },
): CaptureResult | null {
  if (event.event === PAGEVIEW_EVENT) {
    return sanitizeCapturedPageview(event, context);
  }
  if (event.event === OUTBOUND_CLICK_EVENT) {
    return sanitizeCapturedOutboundClick(event, context);
  }
  if (event.event === COUNT_TABLE_VIEW_EVENT) {
    return sanitizeCapturedCountTableView(event, context);
  }
  if (event.event === HEADCOUNT_CHANGE_EVENT) {
    return sanitizeCapturedHeadcountChange(event, context);
  }
  if (event.event === LIST_SHARE_EVENT) {
    return sanitizeCapturedListShare(event, context);
  }
  return null;
}

/**
 * Shared anonymous / token / distinct_id gate for pageviews and outbound clicks.
 * `build` returns the event-specific properties (without token / distinct_id / SDK ids).
 */
function sanitizeAnonymousEvent(
  event: CaptureResult,
  context: { search: string; storage: QaStorage },
  build: (properties: Record<string, unknown>, qa: boolean) => Record<string, unknown> | null,
): CaptureResult | null {
  if (!event.properties) {
    return null;
  }
  const properties = event.properties as Record<string, unknown>;
  if (properties.$is_identified === true || properties.$process_person_profile === true) {
    return null;
  }
  const distinctId = properties.distinct_id;
  if (distinctId !== undefined && !isAnonymousId(distinctId)) {
    return null;
  }
  if (typeof properties.token !== "string" || !PROJECT_TOKEN.test(properties.token)) {
    return null;
  }
  const qa = rememberAnalyticsQa(context.search, context.storage);
  const next = build(properties, qa);
  if (!next) {
    return null;
  }
  next.token = properties.token;
  if (typeof distinctId === "string") {
    next.distinct_id = distinctId;
  }
  copyString(properties, "$session_id", next);
  copyString(properties, "$window_id", next);
  copyString(properties, "$pageview_id", next);
  copyString(properties, "$insert_id", next);
  copyString(properties, "$lib", next);
  copyString(properties, "$lib_version", next);
  if (typeof properties.$time === "number" && Number.isFinite(properties.$time)) {
    next.$time = properties.$time;
  }
  const sanitized: CaptureResult = { ...event, properties: next };
  delete sanitized.$set;
  delete sanitized.$set_once;
  delete sanitized.$unset;
  return sanitized;
}

/**
 * Accept or refuse analytics before the SDK is loaded. A second call in the
 * same document (React StrictMode, or a duplicated instrumentation module)
 * returns null so initialization and its initial pageview happen once.
 */
export function beginWebAnalytics(
  target: AnalyticsScope,
  env: IngestionEnv,
): { init(client: AnalyticsClient): void } | null {
  try {
    if (!shouldCaptureHostname(target.location?.hostname ?? "")) {
      analyticsWillStart = false;
      pendingCountTableView = null;
      return null;
    }
    const config = resolveIngestionConfig(env);
    if (!config) {
      analyticsWillStart = false;
      pendingCountTableView = null;
      return null;
    }
    analyticsWillStart = true;
    const scope = target as AnalyticsTarget;
    const storage = createQaStore(target.sessionStorage);
    rememberAnalyticsQa(target.location.search ?? "", storage);
    if (scope[INSTALLED_FLAG]) {
      return null;
    }
    scope[INSTALLED_FLAG] = true;
    // The SDK chunk loads after the first paint. Record the landing path and any
    // pathname change that happens before init, then send that list once.
    const trail = createPathTrail(target);
    let started = false;
    return {
      init(client) {
        if (started) {
          return;
        }
        started = true;
        activeClient = client;
        client.init(config.token, {
          api_host: config.host,
          defaults: "2026-08-30",
          // The path trail above is the only pageview mechanism. The SDK's own
          // history listener would also capture whatever URL is current at init.
          capture_pageview: false,
          capture_pageleave: false,
          autocapture: false,
          capture_dead_clicks: false,
          capture_exceptions: false,
          capture_heatmaps: false,
          capture_performance: false,
          disable_session_recording: true,
          disable_surveys: true,
          rageclick: false,
          advanced_disable_flags: true,
          person_profiles: "identified_only",
          save_campaign_params: false,
          disable_scroll_properties: true,
          disable_capture_url_hashes: true,
          cross_subdomain_cookie: false,
          mask_personal_data_properties: true,
          debug: false,
          // One small pageview per navigation. Batching would delay that send.
          request_batching: false,
          disable_compression: true,
          before_send: (event) => {
            try {
              return sanitizeCapturedEvent(event, {
                search: target.location.search ?? "",
                storage,
              });
            } catch {
              return null;
            }
          },
        });
        trail.start((href) => {
          try {
            client.capture(PAGEVIEW_EVENT, { $current_url: href });
          } catch {
            // A failed send must not affect navigation.
          }
        });
        // A table view can fire before this chunk arrives. Send it after the
        // pageviews so it keeps the current $pageview_id.
        const queuedTable = pendingCountTableView;
        pendingCountTableView = null;
        if (queuedTable) {
          try {
            client.capture(COUNT_TABLE_VIEW_EVENT, queuedTable);
          } catch {
            // Counting is best effort.
          }
        }
      },
    };
  } catch {
    return null;
  }
}

/**
 * Record a shop-link click in PostHog. No-ops when analytics is off (non-production
 * host, missing config, or SDK not yet initialized). Never throws into the click path.
 */
export function captureOutboundClick(detail: OutboundClickDetail): void {
  try {
    if (!activeClient) {
      return;
    }
    const props: Record<string, unknown> = {
      shop: detail.shop,
      host: detail.host,
      drink_slug: detail.drinkSlug,
      path: detail.path,
      position: detail.position,
    };
    if (detail.venue) {
      props.venue = detail.venue;
    }
    if (detail.source) {
      props.source = detail.source;
    }
    if (typeof detail.headcount === "number") {
      props.headcount = detail.headcount;
    }
    if (typeof detail.headcountChanged === "boolean") {
      props.headcount_changed = detail.headcountChanged;
    }
    if (typeof detail.countTableViewed === "boolean") {
      props.count_table_viewed = detail.countTableViewed;
    }
    if (detail.role) {
      props.role = detail.role;
    }
    if (detail.viewport) {
      props.viewport = detail.viewport;
    }
    activeClient.capture(OUTBOUND_CLICK_EVENT, props);
  } catch {
    // Counting is best effort.
  }
}

export function captureCountTableView(detail: CountTableViewDetail): void {
  try {
    const props = { venue: detail.venue, viewport: detail.viewport };
    if (!activeClient) {
      if (analyticsWillStart) {
        pendingCountTableView = props;
      }
      return;
    }
    pendingCountTableView = null;
    activeClient.capture(COUNT_TABLE_VIEW_EVENT, props);
  } catch {
    // Counting is best effort.
  }
}

export function captureHeadcountChange(detail: HeadcountChangeDetail): void {
  try {
    if (!activeClient) {
      return;
    }
    activeClient.capture(HEADCOUNT_CHANGE_EVENT, {
      venue: detail.venue,
      headcount_from: detail.headcountFrom,
      headcount_to: detail.headcountTo,
      method: detail.method,
      change_index: detail.changeIndex,
      table_on_page: detail.tableOnPage,
      viewport: detail.viewport,
    });
  } catch {
    // Counting is best effort.
  }
}

export function captureListShare(detail: ListShareDetail): void {
  try {
    if (!activeClient) {
      return;
    }
    activeClient.capture(LIST_SHARE_EVENT, {
      venue: detail.venue,
      method: detail.method,
      headcount: detail.headcount,
      headcount_changed: detail.headcountChanged,
      viewport: detail.viewport,
    });
  } catch {
    // Counting is best effort.
  }
}

const HISTORY_PATCH = "__stylishWebAnalyticsHistory";

function createPathTrail(target: AnalyticsScope): { start(send: (href: string) => void): void } {
  const pending: string[] = [];
  let lastPath: string | null = null;
  let send: ((href: string) => void) | null = null;

  function remember(href: string): void {
    const path = pathnameOf(href);
    if (!path || path === lastPath) {
      return;
    }
    lastPath = path;
    if (send) {
      send(href);
      return;
    }
    pending.push(href);
  }

  remember(target.location.href ?? "");
  watchPathname(target, () => {
    const href = target.location.href;
    if (href) {
      remember(href);
    }
  });

  return {
    start(next) {
      send = next;
      const queued = pending.splice(0);
      for (const href of queued) {
        send(href);
      }
    },
  };
}

interface HistoryPatch {
  pushState: (...args: unknown[]) => unknown;
  replaceState: (...args: unknown[]) => unknown;
  [HISTORY_PATCH]?: boolean;
}

function watchPathname(target: AnalyticsScope, onChange: () => void): void {
  const scope = target as AnalyticsScope & {
    history?: HistoryPatch;
    addEventListener?: (type: string, listener: () => void) => void;
  };
  const history = scope.history;
  if (!history || history[HISTORY_PATCH]) {
    return;
  }
  history[HISTORY_PATCH] = true;
  for (const method of ["pushState", "replaceState"] as const) {
    const original = history[method];
    history[method] = (...args: unknown[]) => {
      const result = original.apply(history, args);
      onChange();
      return result;
    };
  }
  scope.addEventListener?.("popstate", onChange);
}

function pathnameOf(href: string): string | null {
  if (!href) {
    return null;
  }
  try {
    return new URL(href).pathname || "/";
  } catch {
    return null;
  }
}

function createQaStore(storage: QaStorage | undefined): QaStorage {
  let memory: string | null = null;
  return {
    getItem(key) {
      try {
        if (storage?.getItem(key) === "1") {
          return "1";
        }
      } catch {
        // Storage can throw in private mode. The in-memory mark still covers this document.
      }
      return key === QA_STORAGE_KEY ? memory : null;
    },
    setItem(key, value) {
      if (key === QA_STORAGE_KEY && value === "1") {
        memory = "1";
      }
      try {
        storage?.setItem(key, value);
      } catch {
        // The page keeps working when storage is blocked.
      }
    },
  };
}

function readVenue(value: unknown): string | null {
  if (typeof value !== "string" || !SLUG.test(value)) {
    return null;
  }
  return value;
}

function readOptionalChoice(value: unknown, allowed: ReadonlySet<string>): string | undefined | null {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "string" && allowed.has(value)) {
    return value;
  }
  return null;
}

function readRequiredChoice(value: unknown, allowed: ReadonlySet<string>): string | null {
  const choice = readOptionalChoice(value, allowed);
  if (choice === undefined || choice === null) {
    return null;
  }
  return choice;
}

function readOptionalHeadcount(value: unknown): number | undefined | null {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "number" && Number.isInteger(value) && value >= MIN_HEADCOUNT && value <= MAX_HEADCOUNT) {
    return value;
  }
  return null;
}

function readRequiredHeadcount(value: unknown): number | null {
  const headcount = readOptionalHeadcount(value);
  if (headcount === undefined || headcount === null) {
    return null;
  }
  return headcount;
}

function readOptionalBool(value: unknown): boolean | undefined | null {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return null;
}

function readRequiredBool(value: unknown): boolean | null {
  const flag = readOptionalBool(value);
  if (flag === undefined || flag === null) {
    return null;
  }
  return flag;
}

function readChangeIndex(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_CHANGE_INDEX) {
    return null;
  }
  return value;
}

function isAnonymousId(value: unknown): value is string {
  return typeof value === "string" && ANONYMOUS_ID.test(value);
}

function copyString(properties: Record<string, unknown>, key: string, into: Record<string, unknown>): void {
  const value = properties[key];
  if (typeof value === "string" && value.length > 0 && value.length <= 200 && !/[\s?#@]/.test(value)) {
    into[key] = value;
  }
}

interface CleanUrl {
  href: string;
  pathname: string;
  hostname: string;
}

function sanitizeHttpUrl(value: unknown): CleanUrl | null {
  if (typeof value !== "string" || value === DIRECT) {
    return null;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    const pathname = url.pathname || "/";
    return {
      href: `${url.origin}${pathname}`,
      pathname,
      hostname: url.hostname,
    };
  } catch {
    return null;
  }
}

function sanitizeReferrer(value: unknown): { href: string; domain: string } {
  if (typeof value !== "string" || value === "" || value === DIRECT) {
    return { href: DIRECT, domain: DIRECT };
  }
  const clean = sanitizeHttpUrl(value);
  if (!clean) {
    return { href: DIRECT, domain: DIRECT };
  }
  return { href: clean.href, domain: clean.hostname };
}
