import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  COUNT_TABLE_VIEW_EVENT,
  COUNT_TABLE_VIEW_PROPERTIES,
  beginWebAnalytics,
  captureOutboundClick,
  ESSENTIAL_EVENT_PROPERTIES,
  HEADCOUNT_CHANGE_EVENT,
  HEADCOUNT_CHANGE_PROPERTIES,
  LIST_SHARE_EVENT,
  LIST_SHARE_PROPERTIES,
  OUTBOUND_CLICK_EVENT,
  OUTBOUND_CLICK_PROPERTIES,
  PAGEVIEW_EVENT,
  rememberAnalyticsQa,
  resolveIngestionConfig,
  sanitizeCapturedEvent,
  sanitizeCapturedOutboundClick,
  sanitizeCapturedPageview,
  shouldCaptureHostname,
  type AnalyticsClient,
  type QaStorage,
} from "../lib/web-analytics.ts";
import {
  HEADCOUNT_DEBOUNCE_MS,
  currentViewport,
  flushHeadcountChange,
  noteHeadcount,
  outboundUsageProps,
  readUsage,
  resetUsageSession,
  setTableOnPage,
  shareList,
  viewCountTable,
} from "../lib/usage-session.ts";

const FAKE_TOKEN = "phc_aaaaaaaaaaaaaaaa";
const EU_HOST = "https://eu.i.posthog.com";
const failures: string[] = [];

function fail(message: string): void {
  failures.push(message);
}

function expect(condition: boolean, message: string): void {
  if (!condition) {
    fail(message);
  }
}

function memoryStorage(initial?: Record<string, string>): QaStorage & { snapshot(): Record<string, string> } {
  const data = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (key) => (data.has(key) ? (data.get(key) as string) : null),
    setItem: (key, value) => {
      data.set(key, value);
    },
    snapshot: () => Object.fromEntries(data),
  };
}

expect(resolveIngestionConfig({}) === null, "missing config does not invent an ingestion target");
expect(resolveIngestionConfig({ token: "", host: "" }) === null, "empty config stays off");
expect(resolveIngestionConfig({ token: FAKE_TOKEN }) === null, "a token without a host stays off");
expect(resolveIngestionConfig({ host: EU_HOST }) === null, "a host without a token stays off");
expect(resolveIngestionConfig({ token: "phx_secretvalue000000", host: EU_HOST }) === null, "a personal API key is refused");
expect(resolveIngestionConfig({ token: "phc_short", host: EU_HOST }) === null, "a short project token is refused");
expect(
  resolveIngestionConfig({ token: FAKE_TOKEN, host: "http://eu.i.posthog.com" }) === null,
  "a non-https ingestion host is refused",
);
expect(
  resolveIngestionConfig({ token: FAKE_TOKEN, host: "https://example.com" }) === null,
  "an unknown host is refused",
);
expect(
  resolveIngestionConfig({ token: FAKE_TOKEN, host: "https://eu.posthog.com" }) === null,
  "the app host is not an ingestion host",
);
expect(
  resolveIngestionConfig({ token: FAKE_TOKEN, host: "https://eu.i.posthog.com/e/" }) === null,
  "a host with a path is refused",
);
const accepted = resolveIngestionConfig({ token: `  ${FAKE_TOKEN}  `, host: `${EU_HOST}/` });
expect(accepted?.token === FAKE_TOKEN && accepted.host === EU_HOST, "a public project token and official host are accepted");
expect(
  resolveIngestionConfig({ token: FAKE_TOKEN, host: "https://us.i.posthog.com" })?.host === "https://us.i.posthog.com",
  "the US ingestion host is accepted only when configured",
);

for (const hostname of ["localhost", "127.0.0.1", "sunsup.pages.dev", "stylish.sunsup.me.evil.test", "www.stylish.sunsup.me", "preview.stylish.sunsup.me", "STYLISH.SUNSUP.ME"]) {
  expect(!shouldCaptureHostname(hostname), `${hostname} does not capture`);
}
expect(shouldCaptureHostname("stylish.sunsup.me"), "the production hostname captures");

const fresh = memoryStorage();
expect(rememberAnalyticsQa("", fresh) === false && fresh.snapshot().analytics_qa === undefined, "an unmarked session stays unmarked");
expect(rememberAnalyticsQa("?analytics_qa=0", fresh) === false, "analytics_qa=0 does not mark the session");
expect(rememberAnalyticsQa("?analytics_qa=1&email=person@example.com", fresh) === true, "analytics_qa=1 marks the session");
expect(fresh.snapshot().analytics_qa === "1", "the QA mark is stored for the tab session");
expect(rememberAnalyticsQa("", fresh) === true, "the stored mark survives a later URL without the parameter");
expect(rememberAnalyticsQa("?analytics_qa=0", fresh) === true, "a later analytics_qa=0 does not clear the session mark");
const marked = memoryStorage({ analytics_qa: "1" });
expect(rememberAnalyticsQa("", marked) === true, "a mark written before the first event is honored");

const allowed = new Set<string>(ESSENTIAL_EVENT_PROPERTIES);
const dirty = {
  uuid: "00000000-0000-4000-8000-000000000001",
  event: PAGEVIEW_EVENT,
  properties: {
    token: FAKE_TOKEN,
    distinct_id: "0190aabb-ccdd-7eef-8000-000000000001",
    $current_url: "https://stylish.sunsup.me/drink/kimino-yuzu/?email=person@example.com&utm_source=newsletter#secret",
    $pathname: "/drink/kimino-yuzu/",
    $host: "stylish.sunsup.me",
    $referrer: "https://user:pass@news.example/story?utm_source=newsletter&email=person@example.com#frag",
    $referring_domain: "news.example",
    $session_id: "0190session",
    $window_id: "0190window",
    $pageview_id: "0190page",
    $insert_id: "insert123",
    $lib: "web",
    $lib_version: "1.447.3",
    $time: 1_700_000_000,
    $process_person_profile: false,
    $is_identified: false,
    $raw_user_agent: "Mozilla/5.0 secret",
    $browser: "Chrome",
    $device_id: "device-id",
    $initial_current_url: "https://stylish.sunsup.me/?email=person@example.com#secret",
    $session_entry_url: "https://stylish.sunsup.me/?analytics_qa=1&email=person@example.com",
    $session_entry_referrer: "https://news.example/story?email=person@example.com#frag",
    title: "STYLISH!",
    utm_source: "newsletter",
    email: "person@example.com",
  },
  $set: { email: "person@example.com" },
  $set_once: { $initial_current_url: "https://stylish.sunsup.me/?email=person@example.com" },
};
const qaStorage = memoryStorage();
const cleaned = sanitizeCapturedPageview(dirty, { search: "?analytics_qa=1", storage: qaStorage });
expect(cleaned?.event === PAGEVIEW_EVENT, "a pageview is kept");
expect(cleaned?.properties.$current_url === "https://stylish.sunsup.me/drink/kimino-yuzu/", "the current URL drops query and hash");
expect(cleaned?.properties.$pathname === "/drink/kimino-yuzu/", "the pathname has no query");
expect(cleaned?.properties.$host === "stylish.sunsup.me", "the host is the hostname only");
expect(cleaned?.properties.$referrer === "https://news.example/story", "the referrer drops userinfo, query, and hash");
expect(cleaned?.properties.$referring_domain === "news.example", "the referring domain is the hostname");
expect(cleaned?.properties.analytics_qa === true, "the QA mark is on the sanitized pageview");
expect(cleaned?.properties.$process_person_profile === false, "anonymous events do not process a person profile");
expect(cleaned?.properties.$is_identified === false, "events stay unidentified");
expect(cleaned?.$set === undefined && cleaned?.$set_once === undefined, "person property bags are removed");
const cleanedKeys = Object.keys(cleaned?.properties ?? {});
expect(cleanedKeys.every((key) => allowed.has(key)), `unexpected property: ${cleanedKeys.filter((key) => !allowed.has(key)).join(",")}`);
const serialized = JSON.stringify(cleaned);
expect(!serialized.includes("email=") && !serialized.includes("person@") && !serialized.includes("utm_") && !serialized.includes("#secret") && !serialized.includes("#frag"), "identifying query and hash fragments are absent");
expect(!serialized.includes("$raw_user_agent") && !serialized.includes("$initial_") && !serialized.includes("Mozilla"), "SDK device and initial URL copies are absent");

expect(
  sanitizeCapturedPageview({ ...dirty, event: "$pageleave" }, { search: "", storage: memoryStorage() }) === null,
  "pageleave is not sent",
);
expect(
  sanitizeCapturedPageview({ ...dirty, event: "$autocapture" }, { search: "", storage: memoryStorage() }) === null,
  "autocapture is not sent",
);
expect(
  sanitizeCapturedPageview({ ...dirty, event: "$exception" }, { search: "", storage: memoryStorage() }) === null,
  "exception capture is not sent",
);
expect(
  sanitizeCapturedPageview(
    { ...dirty, properties: { ...dirty.properties, $is_identified: true } },
    { search: "", storage: memoryStorage() },
  ) === null,
  "an identified event is not sent",
);
expect(
  sanitizeCapturedPageview(
    { ...dirty, properties: { ...dirty.properties, $current_url: "https://localhost/about/?q=1" } },
    { search: "", storage: memoryStorage() },
  ) === null,
  "a non-production URL is not sent",
);
expect(
  sanitizeCapturedPageview(
    { ...dirty, properties: { ...dirty.properties, distinct_id: "person@example.com" } },
    { search: "", storage: memoryStorage() },
  ) === null,
  "an email distinct id is not sent",
);


const outboundAllowed = new Set<string>([...ESSENTIAL_EVENT_PROPERTIES, ...OUTBOUND_CLICK_PROPERTIES]);
const outboundDirty = {
  uuid: "00000000-0000-4000-8000-000000000002",
  event: OUTBOUND_CLICK_EVENT,
  properties: {
    token: FAKE_TOKEN,
    distinct_id: "0190aabb-ccdd-7eef-8000-000000000001",
    shop: "amazon",
    host: "www.amazon.co.jp",
    drink_slug: "kimino-yuzu",
    path: "/ba/bonenkai/",
    venue: "bonenkai",
    position: 2,
    source: "list",
    $session_id: "0190session",
    $window_id: "0190window",
    $insert_id: "insert456",
    $lib: "web",
    $lib_version: "1.447.3",
    $time: 1_700_000_001,
    $process_person_profile: false,
    $is_identified: false,
    $raw_user_agent: "Mozilla/5.0 secret",
    email: "person@example.com",
    title: "STYLISH!",
  },
  $set: { email: "person@example.com" },
};
const outboundCleaned = sanitizeCapturedOutboundClick(outboundDirty, { search: "?analytics_qa=1", storage: memoryStorage() });
expect(outboundCleaned?.event === OUTBOUND_CLICK_EVENT, "an outbound_click is kept");
expect(outboundCleaned?.properties.shop === "amazon", "shop kind is kept");
expect(outboundCleaned?.properties.host === "www.amazon.co.jp", "shop host is kept");
expect(outboundCleaned?.properties.drink_slug === "kimino-yuzu", "drink slug is kept");
expect(outboundCleaned?.properties.path === "/ba/bonenkai/", "page path is kept");
expect(outboundCleaned?.properties.venue === "bonenkai", "venue slug is kept");
expect(outboundCleaned?.properties.position === 2, "link position is kept");
expect(outboundCleaned?.properties.source === "list", "click source is kept");
expect(outboundCleaned?.properties.analytics_qa === true, "the QA mark is on the sanitized outbound_click");
expect(
  Object.keys(outboundCleaned?.properties ?? {}).every((key) => outboundAllowed.has(key)),
  `unexpected outbound property: ${Object.keys(outboundCleaned?.properties ?? {}).filter((key) => !outboundAllowed.has(key)).join(",")}`,
);
expect(JSON.stringify(outboundCleaned).includes("Mozilla") === false, "device fields are stripped from outbound_click");
expect(
  sanitizeCapturedOutboundClick(
    { ...outboundDirty, properties: { ...outboundDirty.properties, shop: "ebay" } },
    { search: "", storage: memoryStorage() },
  ) === null,
  "an unknown shop kind is refused",
);
expect(
  sanitizeCapturedOutboundClick(
    { ...outboundDirty, properties: { ...outboundDirty.properties, drink_slug: "../etc" } },
    { search: "", storage: memoryStorage() },
  ) === null,
  "a non-slug drink id is refused",
);
expect(
  sanitizeCapturedEvent(outboundDirty, { search: "", storage: memoryStorage() })?.event === OUTBOUND_CLICK_EVENT,
  "sanitizeCapturedEvent keeps outbound_click",
);
expect(
  sanitizeCapturedEvent({ ...dirty, event: "$pageleave" }, { search: "", storage: memoryStorage() }) === null,
  "sanitizeCapturedEvent still drops pageleave",
);

function anonymousProperties(extra: Record<string, unknown>): Record<string, unknown> {
  return {
    token: FAKE_TOKEN,
    distinct_id: "0190aabb-ccdd-7eef-8000-000000000001",
    $session_id: "0190session",
    $window_id: "0190window",
    $pageview_id: "0190pageview",
    $insert_id: "insert789",
    $lib: "web",
    $lib_version: "1.447.3",
    $time: 1_700_000_002,
    $process_person_profile: false,
    $is_identified: false,
    $geoip_city_name: "Tokyo",
    $geoip_postal_code: "150-0001",
    $geoip_latitude: 35.68,
    $geoip_longitude: 139.69,
    $ip: "203.0.113.5",
    email: "person@example.com",
    text: "買い出しの本文",
    ...extra,
  };
}

function anonymousCapture(event: string, extra: Record<string, unknown>) {
  return {
    uuid: "00000000-0000-4000-8000-000000000003",
    event,
    properties: anonymousProperties(extra),
    $set: { email: "person@example.com" },
  };
}

function keptKeys(properties: Record<string, unknown> | undefined, allowed: Set<string>, label: string): void {
  const keys = Object.keys(properties ?? {});
  expect(keys.every((key) => allowed.has(key)), `${label} unexpected property: ${keys.filter((key) => !allowed.has(key)).join(",")}`);
}

function privateFree(value: unknown, label: string): void {
  const wire = JSON.stringify(value);
  expect(
    !wire.includes("Tokyo") &&
      !wire.includes("203.0.113.5") &&
      !wire.includes("150-0001") &&
      !wire.includes("35.68") &&
      !wire.includes("person@") &&
      !wire.includes("買い出しの本文") &&
      !wire.includes("$geoip") &&
      !wire.includes("$ip"),
    `${label} drops city, IP, postal, coordinates, and raw text`,
  );
}

for (const key of ["headcount", "headcount_changed", "count_table_viewed", "role", "viewport"]) {
  expect((OUTBOUND_CLICK_PROPERTIES as readonly string[]).includes(key), `outbound allow list includes ${key}`);
}

const tableAllowed = new Set<string>([...ESSENTIAL_EVENT_PROPERTIES, ...COUNT_TABLE_VIEW_PROPERTIES]);
const tableKept = sanitizeCapturedEvent(anonymousCapture(COUNT_TABLE_VIEW_EVENT, { venue: "bonenkai", viewport: "narrow" }), {
  search: "?analytics_qa=1",
  storage: memoryStorage(),
});
expect(tableKept?.event === COUNT_TABLE_VIEW_EVENT, "count_table_view is kept");
expect(tableKept?.properties.venue === "bonenkai", "count_table_view keeps venue");
expect(tableKept?.properties.viewport === "narrow", "count_table_view keeps viewport");
expect(tableKept?.properties.analytics_qa === true, "the QA query marks count_table_view");
expect(tableKept?.properties.$pageview_id === "0190pageview", "count_table_view keeps $pageview_id");
expect(tableKept?.$set === undefined, "count_table_view drops person properties");
keptKeys(tableKept?.properties, tableAllowed, "count_table_view");
privateFree(tableKept, "count_table_view");
const storedQa = memoryStorage({ analytics_qa: "1" });
expect(
  sanitizeCapturedEvent(anonymousCapture(COUNT_TABLE_VIEW_EVENT, { venue: "kaisha", viewport: "wide" }), { search: "", storage: storedQa })?.properties.analytics_qa === true,
  "a stored QA mark applies to count_table_view",
);
expect(
  sanitizeCapturedEvent(anonymousCapture(COUNT_TABLE_VIEW_EVENT, { venue: "kansougeikai", viewport: "wide" }), { search: "", storage: memoryStorage() })?.properties.analytics_qa === false,
  "count_table_view stays unmarked without the QA flag",
);
for (const [label, extra] of [
  ["an unknown viewport", { venue: "bonenkai", viewport: "mobile" }],
  ["a missing venue", { viewport: "wide" }],
  ["a non-slug venue", { venue: "BonEnkai", viewport: "wide" }],
] as [string, Record<string, unknown>][]) {
  expect(
    sanitizeCapturedEvent(anonymousCapture(COUNT_TABLE_VIEW_EVENT, extra), { search: "", storage: memoryStorage() }) === null,
    `count_table_view drops ${label}`,
  );
}
expect(
  sanitizeCapturedEvent(
    { ...anonymousCapture(COUNT_TABLE_VIEW_EVENT, { venue: "bonenkai", viewport: "wide" }), properties: { ...anonymousProperties({ venue: "bonenkai", viewport: "wide" }), $is_identified: true } },
    { search: "", storage: memoryStorage() },
  ) === null,
  "an identified count_table_view is dropped",
);

const changeAllowed = new Set<string>([...ESSENTIAL_EVENT_PROPERTIES, ...HEADCOUNT_CHANGE_PROPERTIES]);
const changeKept = sanitizeCapturedEvent(
  anonymousCapture(HEADCOUNT_CHANGE_EVENT, {
    venue: "kaisha",
    headcount_from: 4,
    headcount_to: 8,
    method: "mixed",
    change_index: 2,
    table_on_page: false,
    viewport: "wide",
  }),
  { search: "?analytics_qa=1", storage: memoryStorage() },
);
expect(changeKept?.event === HEADCOUNT_CHANGE_EVENT, "headcount_change is kept");
expect(changeKept?.properties.headcount_from === 4 && changeKept?.properties.headcount_to === 8, "headcount_change keeps the grouped counts");
expect(changeKept?.properties.method === "mixed", "headcount_change keeps method");
expect(changeKept?.properties.change_index === 2, "headcount_change keeps change_index");
expect(changeKept?.properties.table_on_page === false, "headcount_change keeps table_on_page false");
expect(changeKept?.properties.viewport === "wide", "headcount_change keeps viewport");
expect(changeKept?.properties.analytics_qa === true, "the QA query marks headcount_change");
keptKeys(changeKept?.properties, changeAllowed, "headcount_change");
privateFree(changeKept, "headcount_change");
for (const [label, extra] of [
  ["an unchanged count", { venue: "kaisha", headcount_from: 4, headcount_to: 4, method: "type", change_index: 1, table_on_page: true, viewport: "wide" }],
  ["a count below 1", { venue: "kaisha", headcount_from: 0, headcount_to: 4, method: "type", change_index: 1, table_on_page: true, viewport: "wide" }],
  ["a count above 200", { venue: "kaisha", headcount_from: 4, headcount_to: 201, method: "type", change_index: 1, table_on_page: true, viewport: "wide" }],
  ["a fractional count", { venue: "kaisha", headcount_from: 4, headcount_to: 4.2, method: "type", change_index: 1, table_on_page: true, viewport: "wide" }],
  ["a string count", { venue: "kaisha", headcount_from: 4, headcount_to: "8", method: "type", change_index: 1, table_on_page: true, viewport: "wide" }],
  ["an unknown method", { venue: "kaisha", headcount_from: 4, headcount_to: 8, method: "keyboard", change_index: 1, table_on_page: true, viewport: "wide" }],
  ["a share method", { venue: "kaisha", headcount_from: 4, headcount_to: 8, method: "line", change_index: 1, table_on_page: true, viewport: "wide" }],
  ["a zero change_index", { venue: "kaisha", headcount_from: 4, headcount_to: 8, method: "step_up", change_index: 0, table_on_page: true, viewport: "wide" }],
  ["a fractional change_index", { venue: "kaisha", headcount_from: 4, headcount_to: 8, method: "step_up", change_index: 1.2, table_on_page: true, viewport: "wide" }],
  ["a string table flag", { venue: "kaisha", headcount_from: 4, headcount_to: 8, method: "step_down", change_index: 1, table_on_page: "false", viewport: "wide" }],
  ["an unknown viewport", { venue: "kaisha", headcount_from: 4, headcount_to: 8, method: "type", change_index: 1, table_on_page: true, viewport: "desktop" }],
  ["a missing method", { venue: "kaisha", headcount_from: 4, headcount_to: 8, change_index: 1, table_on_page: true, viewport: "wide" }],
] as [string, Record<string, unknown>][]) {
  expect(
    sanitizeCapturedEvent(anonymousCapture(HEADCOUNT_CHANGE_EVENT, extra), { search: "", storage: memoryStorage() }) === null,
    `headcount_change drops ${label}`,
  );
}

const shareAllowed = new Set<string>([...ESSENTIAL_EVENT_PROPERTIES, ...LIST_SHARE_PROPERTIES]);
const shareKept = sanitizeCapturedEvent(
  anonymousCapture(LIST_SHARE_EVENT, { venue: "sashiire", method: "line", headcount: 4, headcount_changed: false, viewport: "narrow" }),
  { search: "", storage: memoryStorage() },
);
expect(shareKept?.event === LIST_SHARE_EVENT, "list_share is kept");
expect(shareKept?.properties.method === "line", "list_share keeps line");
expect(shareKept?.properties.headcount === 4, "list_share keeps headcount");
expect(shareKept?.properties.headcount_changed === false, "list_share keeps headcount_changed false");
expect(shareKept?.properties.analytics_qa === false, "list_share stays unmarked without the QA flag");
keptKeys(shareKept?.properties, shareAllowed, "list_share");
privateFree(shareKept, "list_share");
expect(
  sanitizeCapturedEvent(
    anonymousCapture(LIST_SHARE_EVENT, { venue: "okurimono", method: "copy", headcount: 20, headcount_changed: true, viewport: "wide" }),
    { search: "?analytics_qa=true", storage: memoryStorage() },
  )?.properties.analytics_qa === true,
  "the QA query marks list_share",
);
for (const [label, extra] of [
  ["a headcount method", { venue: "sashiire", method: "step_up", headcount: 4, headcount_changed: false, viewport: "wide" }],
  ["a count below 1", { venue: "sashiire", method: "copy", headcount: 0, headcount_changed: false, viewport: "wide" }],
  ["a count above 200", { venue: "sashiire", method: "copy", headcount: 201, headcount_changed: false, viewport: "wide" }],
  ["a string changed flag", { venue: "sashiire", method: "copy", headcount: 4, headcount_changed: "yes", viewport: "wide" }],
  ["a missing viewport", { venue: "sashiire", method: "copy", headcount: 4, headcount_changed: false }],
] as [string, Record<string, unknown>][]) {
  expect(
    sanitizeCapturedEvent(anonymousCapture(LIST_SHARE_EVENT, extra), { search: "", storage: memoryStorage() }) === null,
    `list_share drops ${label}`,
  );
}

const markedClick = sanitizeCapturedOutboundClick(
  {
    ...outboundDirty,
    properties: {
      ...outboundDirty.properties,
      headcount: 12,
      headcount_changed: true,
      count_table_viewed: false,
      role: "table",
      viewport: "narrow",
      $geoip_city_name: "Tokyo",
      $ip: "203.0.113.5",
      $geoip_latitude: 35.68,
      text: "買い出しの本文",
    },
  },
  { search: "", storage: memoryStorage() },
);
expect(markedClick?.properties.headcount === 12, "outbound_click keeps list headcount");
expect(markedClick?.properties.headcount_changed === true, "outbound_click keeps headcount_changed");
expect(markedClick?.properties.count_table_viewed === false, "outbound_click keeps count_table_viewed false");
expect(markedClick?.properties.role === "table", "outbound_click keeps role");
expect(markedClick?.properties.viewport === "narrow", "outbound_click keeps viewport");
expect(markedClick?.properties.shop === "amazon", "usage marks do not replace the shop click");
keptKeys(markedClick?.properties, outboundAllowed, "marked outbound_click");
privateFree(markedClick, "marked outbound_click");
for (const [label, patch] of [
  ["headcount 0", { headcount: 0 }],
  ["headcount 201", { headcount: 201 }],
  ["a fractional headcount", { headcount: 4.5 }],
  ["a string headcount", { headcount: "12" }],
  ["headcount off the list", { headcount: 12, source: "page" }],
  ["headcount without a source", { headcount: 12, source: undefined }],
  ["a string headcount_changed", { headcount_changed: "true" }],
  ["a numeric count_table_viewed", { count_table_viewed: 1 }],
  ["an unknown role", { role: "drink" }],
  ["an unknown viewport", { viewport: "phone" }],
] as [string, Record<string, unknown>][]) {
  expect(
    sanitizeCapturedOutboundClick(
      { ...outboundDirty, properties: { ...outboundDirty.properties, ...patch } },
      { search: "", storage: memoryStorage() },
    ) === null,
    `outbound_click drops ${label}`,
  );
}

let inits = 0;
const captured: { event: string; properties?: Record<string, unknown> }[] = [];
const mockClient: AnalyticsClient = {
  init() {
    inits += 1;
  },
  capture(event, properties) {
    captured.push({ event, properties });
  },
};
expect(
  beginWebAnalytics({ location: { hostname: "localhost", search: "?analytics_qa=1" }, sessionStorage: memoryStorage() }, { token: FAKE_TOKEN, host: EU_HOST }) === null,
  "localhost does not start analytics",
);
expect(
  beginWebAnalytics({ location: { hostname: "sunsup.pages.dev", search: "" }, sessionStorage: memoryStorage() }, { token: FAKE_TOKEN, host: EU_HOST }) === null,
  "pages.dev does not start analytics",
);
expect(
  beginWebAnalytics({ location: { hostname: "stylish.sunsup.me", search: "" }, sessionStorage: memoryStorage() }, {}) === null,
  "the production host without config does not start analytics",
);
expect(inits === 0, "refused targets do not call init");
const scope = { location: { hostname: "stylish.sunsup.me", search: "?analytics_qa=true" }, sessionStorage: memoryStorage() };
const first = beginWebAnalytics(scope, { token: FAKE_TOKEN, host: EU_HOST });
const second = beginWebAnalytics(scope, { token: FAKE_TOKEN, host: EU_HOST });
expect(first !== null && second === null, "a second start in the same document is ignored");
first?.init(mockClient);
first?.init(mockClient);
expect(inits === 1, "init runs once even if the starter is invoked twice");
expect(scope.sessionStorage.snapshot().analytics_qa === "1", "QA is stored before init");
captureOutboundClick({
  shop: "rakuten",
  host: "item.rakuten.co.jp",
  drinkSlug: "kimino-yuzu",
  path: "/drink/kimino-yuzu/",
  position: 0,
  source: "page",
});
expect(captured.length === 1 && captured[0]?.event === OUTBOUND_CLICK_EVENT, "captureOutboundClick sends outbound_click");
expect(captured[0]?.properties?.shop === "rakuten", "captureOutboundClick keeps shop");
expect(captured[0]?.properties?.drink_slug === "kimino-yuzu", "captureOutboundClick keeps drink_slug");
expect(captured[0]?.properties?.path === "/drink/kimino-yuzu/", "captureOutboundClick keeps path");
expect(captured[0]?.properties?.position === 0, "captureOutboundClick keeps position");
expect(captured[0]?.properties?.venue === undefined, "captureOutboundClick omits venue off a ba page");
captureOutboundClick({
  shop: "amazon",
  host: "www.amazon.co.jp",
  drinkSlug: "kimino-yuzu",
  path: "/ba/bonenkai/",
  venue: "bonenkai",
  position: 1,
  source: "list",
  headcount: 12,
  headcountChanged: true,
  countTableViewed: false,
  role: "meal",
  viewport: "narrow",
});
expect(captured.at(-1)?.properties?.headcount === 12, "captureOutboundClick sends list headcount");
expect(captured.at(-1)?.properties?.headcount_changed === true, "captureOutboundClick sends headcount_changed");
expect(captured.at(-1)?.properties?.count_table_viewed === false, "captureOutboundClick sends count_table_viewed");
expect(captured.at(-1)?.properties?.role === "meal", "captureOutboundClick sends role");
expect(captured.at(-1)?.properties?.viewport === "narrow", "captureOutboundClick sends viewport");
expect(captured.at(-1)?.properties?.text === undefined, "captureOutboundClick has no share text");

expect(currentViewport() === "wide", "without matchMedia the viewport is wide");
Object.defineProperty(globalThis, "matchMedia", {
  configurable: true,
  value: (query: string) => ({
    matches: query === "(max-width: 767px)",
    media: query,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  }),
});
expect(currentViewport() === "narrow", "max-width 767px is narrow");
Reflect.deleteProperty(globalThis, "matchMedia");
expect(currentViewport() === "wide", "clearing matchMedia returns to wide");

resetUsageSession("/ba/bonenkai/");
setTableOnPage(true);
expect(readUsage().headcount === 4 && readUsage().headcountChanged === false, "a pageview starts at 4 people, unchanged");
noteHeadcount(5, "step_up");
noteHeadcount(6, "step_up");
expect(readUsage().headcount === 6 && readUsage().headcountChanged === false, "steps update the count before the change is sent");
const groupedAt = captured.length;
flushHeadcountChange();
expect(captured.length === groupedAt + 1 && captured[groupedAt]?.event === HEADCOUNT_CHANGE_EVENT, "flush sends one headcount_change");
expect(captured[groupedAt]?.properties?.headcount_from === 4, "a grouped change starts at the default");
expect(captured[groupedAt]?.properties?.headcount_to === 6, "a grouped change ends at the latest count");
expect(captured[groupedAt]?.properties?.method === "step_up", "repeated steps stay step_up");
expect(captured[groupedAt]?.properties?.change_index === 1, "the first sent change is index 1");
expect(captured[groupedAt]?.properties?.table_on_page === true, "table_on_page follows the mounted table");
expect(captured[groupedAt]?.properties?.venue === "bonenkai", "headcount_change venue is the page slug");
expect(captured[groupedAt]?.properties?.viewport === "wide", "headcount_change viewport is wide in node");
expect(readUsage().headcountChanged === true, "a sent change marks the pageview");
const passed = sanitizeCapturedEvent(
  {
    event: captured[groupedAt]?.event ?? "",
    properties: anonymousProperties(captured[groupedAt]?.properties ?? {}),
  },
  { search: "?analytics_qa=1", storage: memoryStorage() },
);
expect(passed?.event === HEADCOUNT_CHANGE_EVENT, "a session headcount_change passes the sanitizer");
expect(passed?.properties.analytics_qa === true, "a session headcount_change takes the QA mark");

noteHeadcount(6, "type");
flushHeadcountChange();
expect(captured.length === groupedAt + 1, "the same count is not sent");
noteHeadcount(10, "type");
noteHeadcount(8, "step_down");
flushHeadcountChange();
expect(captured.at(-1)?.properties?.method === "mixed", "step and type in one gesture are mixed");
expect(captured.at(-1)?.properties?.change_index === 2, "change_index counts sent events");
expect(captured.at(-1)?.properties?.headcount_from === 6, "the next gesture starts where the last ended");
expect(captured.at(-1)?.properties?.headcount_to === 8, "the mixed gesture ends at the latest count");
noteHeadcount(9, "step_up");
noteHeadcount(8, "step_down");
flushHeadcountChange();
expect(captured.length === groupedAt + 2, "a gesture that returns to its start is not sent");
expect(readUsage().headcountChanged === true, "an earlier change stays marked");

const shareAt = captured.length;
shareList("line");
expect(captured.length === shareAt + 1 && captured[shareAt]?.event === LIST_SHARE_EVENT, "LINE sends list_share");
expect(captured[shareAt]?.properties?.method === "line", "LINE is method line");
expect(captured[shareAt]?.properties?.headcount === 8, "list_share uses the current headcount");
expect(captured[shareAt]?.properties?.headcount_changed === true, "list_share records that the count changed");
expect(captured[shareAt]?.properties?.text === undefined, "list_share does not carry the shared text");
noteHeadcount(12, "type");
shareList("copy");
expect(captured.at(-2)?.event === HEADCOUNT_CHANGE_EVENT && captured.at(-2)?.properties?.headcount_to === 12, "a share flushes a pending count first");
expect(captured.at(-2)?.properties?.method === "type", "a typed count is method type");
expect(captured.at(-1)?.event === LIST_SHARE_EVENT && captured.at(-1)?.properties?.method === "copy", "copy sends list_share");
expect(captured.at(-1)?.properties?.headcount === 12, "the flushed share uses the new count");
const netAt = captured.length;
noteHeadcount(13, "step_up");
noteHeadcount(12, "step_down");
shareList("copy");
expect(captured.length === netAt + 1 && captured.at(-1)?.event === LIST_SHARE_EVENT, "a share that nets no count change does not insert a headcount_change");

viewCountTable();
expect(captured.at(-1)?.event === COUNT_TABLE_VIEW_EVENT, "the table view is sent once it is on screen");
expect(captured.at(-1)?.properties?.venue === "bonenkai", "count_table_view venue is the page slug");
expect(readUsage().countTableViewed === true, "seeing the table marks the pageview");
const views = captured.length;
viewCountTable();
expect(captured.length === views, "a second table intersection does not send again");
const seen = outboundUsageProps("list", "kanpai");
expect(seen.headcount === 12 && seen.headcountChanged === true && seen.countTableViewed === true && seen.role === "kanpai", "a list click reads the pageview marks");
const pageClick = outboundUsageProps("page", "nope");
expect(pageClick.headcount === undefined && pageClick.role === undefined && pageClick.countTableViewed === true, "a page click omits headcount and an unknown role");

resetUsageSession("/ba/sashiire/");
expect(
  readUsage().headcount === 4 && readUsage().headcountChanged === false && readUsage().countTableViewed === false && readUsage().tableOnPage === false,
  "a new path clears the pageview marks",
);
setTableOnPage(false);
noteHeadcount(3, "step_down");
flushHeadcountChange();
expect(captured.at(-1)?.properties?.venue === "sashiire" && captured.at(-1)?.properties?.table_on_page === false, "a page without the table says so");
expect(captured.at(-1)?.properties?.change_index === 1, "change_index restarts on the new path");
viewCountTable();
expect(captured.at(-1)?.properties?.venue === "sashiire", "the next page can send count_table_view again");
const keptHead = readUsage().headcount;
resetUsageSession("/ba/sashiire/");
expect(readUsage().headcount === keptHead && readUsage().countTableViewed === true, "the same path does not clear the pageview");

const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
let queued: (() => void) | undefined;
let queuedDelay = 0;
globalThis.setTimeout = ((fn: TimerHandler, delay?: number) => {
  queued = typeof fn === "function" ? () => fn() : undefined;
  queuedDelay = delay ?? 0;
  return 0 as unknown as ReturnType<typeof setTimeout>;
}) as typeof setTimeout;
globalThis.clearTimeout = (() => undefined) as typeof clearTimeout;
try {
  resetUsageSession("/ba/office/");
  noteHeadcount(5, "step_up");
  expect(queuedDelay === HEADCOUNT_DEBOUNCE_MS && HEADCOUNT_DEBOUNCE_MS === 1500, "headcount edits wait 1.5s");
  noteHeadcount(7, "step_up");
  const debouncedAt = captured.length;
  queued?.();
  expect(captured.length === debouncedAt + 1, "the debounce sends one grouped change");
  expect(captured.at(-1)?.properties?.headcount_from === 4 && captured.at(-1)?.properties?.headcount_to === 7, "the debounced change spans the whole gesture");
  noteHeadcount(9, "type");
  const abandoned = queued;
  resetUsageSession("/drink/kimino-yuzu/");
  abandoned?.();
  expect(captured.length === debouncedAt + 1, "leaving the page drops an unfinished edit");
  expect(readUsage().headcount === 4, "the new path starts again at 4");
} finally {
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
}

for (const file of ["lib/web-analytics.ts", "lib/usage-session.ts", "instrumentation-client.ts", ".github/workflows/ci.yml", "docs/analytics.md", "app/layout.tsx"]) {
  const source = readFileSync(file, "utf8");
  expect(!/phc_[A-Za-z0-9]{16}/.test(source), `${file} does not contain a project token`);
  expect(!/NEXT_PUBLIC_POSTHOG_HOST\s*(\|\||\?\?)/.test(source), `${file} does not fall back to a host`);
  expect(!/api_host:\s*["']https?:/.test(source), `${file} does not hardcode an api host`);
}
const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
expect(workflow.includes("vars.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"), "the build reads the public token from a repository variable");
expect(workflow.includes("vars.NEXT_PUBLIC_POSTHOG_HOST"), "the build reads the ingestion host from a repository variable");
expect(!workflow.includes("secrets.NEXT_PUBLIC_POSTHOG"), "the public token is not wired as an Actions secret");

const browserCheck = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--import", "./scripts/register-ts.mjs", "scripts/check-web-analytics-browser.mts"],
  { encoding: "utf8" },
);
if (browserCheck.status !== 0) {
  fail(browserCheck.stderr || browserCheck.stdout || "browser history check failed");
}

if (failures.length > 0) {
  console.error(failures.map((message) => `web-analytics: ${message}`).join("\n"));
  process.exit(1);
}
console.log("web-analytics ok: config, hostname, QA mark, sanitized pageview, outbound_click, table view, headcount, list share, and one history pageview path");
process.exit(0);

