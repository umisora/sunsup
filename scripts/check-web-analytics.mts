import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  beginWebAnalytics,
  ESSENTIAL_EVENT_PROPERTIES,
  PAGEVIEW_EVENT,
  rememberAnalyticsQa,
  resolveIngestionConfig,
  sanitizeCapturedPageview,
  shouldCaptureHostname,
  type AnalyticsClient,
  type QaStorage,
} from "../lib/web-analytics.ts";

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

let inits = 0;
const mockClient: AnalyticsClient = {
  init() {
    inits += 1;
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

for (const file of ["lib/web-analytics.ts", "instrumentation-client.ts", ".github/workflows/ci.yml", "docs/analytics.md", "app/layout.tsx"]) {
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
console.log("web-analytics ok: config, hostname, QA mark, sanitized pageview, and one history pageview path");
process.exit(0);

