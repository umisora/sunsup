import type { CaptureResult, PostHogConfig } from "posthog-js";

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
const DIRECT = "$direct";
const INSTALLED_FLAG = "__stylishWebAnalytics";
const SLUG = /^[a-z0-9][a-z0-9-]{0,80}$/;
const HOSTNAME = /^[A-Za-z0-9.-]{1,253}$/;
const PATH = /^\/[A-Za-z0-9/_-]{0,200}$/;
const OUT_SHOPS = new Set(["amazon", "rakuten", "direct", "other", "official"]);
const OUT_SOURCES = new Set(["page", "list"]);

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

/** Extra fields kept on an outbound_click. Shared SDK fields still come from ESSENTIAL_EVENT_PROPERTIES. */
export const OUTBOUND_CLICK_PROPERTIES = [
  "shop",
  "host",
  "drink_slug",
  "path",
  "venue",
  "position",
  "source",
] as const;

export interface OutboundClickDetail {
  shop: string;
  host: string;
  drinkSlug: string;
  path: string;
  venue?: string;
  position: number;
  source?: string;
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
    return next;
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
      return null;
    }
    const config = resolveIngestionConfig(env);
    if (!config) {
      return null;
    }
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
    activeClient.capture(OUTBOUND_CLICK_EVENT, props);
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
