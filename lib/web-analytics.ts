import type { CaptureResult, PostHogConfig } from "posthog-js";

/**
 * Anonymous pageviews for https://stylish.sunsup.me only.
 * The SDK is initialized from instrumentation-client.ts after this module
 * accepts the hostname and the build-time ingestion settings.
 */

export const PRODUCTION_HOSTNAME = "stylish.sunsup.me";
export const QA_QUERY_PARAM = "analytics_qa";
export const QA_STORAGE_KEY = "analytics_qa";
export const PAGEVIEW_EVENT = "$pageview";
const DIRECT = "$direct";
const INSTALLED_FLAG = "__stylishWebAnalytics";

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
  location: { hostname: string; search: string };
  sessionStorage?: QaStorage;
}

export interface AnalyticsClient {
  init(token: string, config?: Partial<PostHogConfig>): void;
}

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
  const properties = event.properties as Record<string, unknown>;
  if (properties.$is_identified === true || properties.$process_person_profile === true) {
    return null;
  }
  const distinctId = properties.distinct_id;
  if (distinctId !== undefined && !isAnonymousId(distinctId)) {
    return null;
  }
  const current = sanitizeHttpUrl(properties.$current_url);
  if (!current || current.hostname !== PRODUCTION_HOSTNAME) {
    return null;
  }
  const referrer = sanitizeReferrer(properties.$referrer);
  const qa = rememberAnalyticsQa(context.search, context.storage);
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
  if (typeof properties.token !== "string" || !PROJECT_TOKEN.test(properties.token)) {
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
  if (typeof properties.token !== "string") {
    return null;
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
    let started = false;
    return {
      init(client) {
        if (started) {
          return;
        }
        started = true;
        client.init(config.token, {
          api_host: config.host,
          defaults: "2026-08-30",
          // One pageview mechanism: the initial view plus pathname changes.
          // Query and hash changes do not create another pageview.
          capture_pageview: "history_change",
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
              return sanitizeCapturedPageview(event, {
                search: target.location.search ?? "",
                storage,
              });
            } catch {
              return null;
            }
          },
        });
      },
    };
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
