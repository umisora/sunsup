/**
 * Loads posthog-js only after a fake window exists. The SDK reads window,
 * document, and location once, when its module is first evaluated.
 */
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

const requests: { url: string; body: string }[] = [];
const browser = installFakeBrowser();
const { beginWebAnalytics, ESSENTIAL_EVENT_PROPERTIES, PAGEVIEW_EVENT } = await import("../lib/web-analytics.ts");
const imported = (await import("posthog-js")) as { posthog?: AnalyticsInit; default?: AnalyticsInit };
const client = analyticsClient(imported);
const allowed = new Set<string>(ESSENTIAL_EVENT_PROPERTIES);

interface AnalyticsInit {
  init(token: string, config?: object): void;
}

if (!client) {
  fail("posthog-js did not expose an init client");
} else {
  const session = beginWebAnalytics(browser.scope, { token: FAKE_TOKEN, host: EU_HOST });
  const again = beginWebAnalytics(browser.scope, { token: FAKE_TOKEN, host: EU_HOST });
  expect(session !== null && again === null, "browser start is single-shot");
  session?.init(client);
  session?.init(client);
  // Next hydration can replace the URL, and drop the QA query, before the initial pageview.
  browser.history.replaceState({ __NA: true }, "", "/");
  await wait(40);
  browser.history.pushState({ __NA: true }, "", "/about/");
  await wait(20);
  browser.history.replaceState({ __NA: true }, "", "/about/");
  await wait(20);
  browser.history.pushState({ __NA: true }, "", "/about/?utm_source=newsletter&email=person@example.com");
  await wait(20);
  browser.history.pushState({ __NA: true }, "", "/drink/kimino-yuzu/#secret");
  await wait(20);
  browser.history.back();
  await wait(20);
  browser.history.forward();
  await wait(40);

  const events = requests.flatMap((request) => {
    expect(request.url === `${EU_HOST}/e/`, `unexpected ingestion URL ${request.url}`);
    const payload = JSON.parse(request.body) as {
      batch?: { event?: string; properties?: Record<string, unknown>; $set?: unknown; $set_once?: unknown }[];
    };
    return payload.batch ?? [];
  });
  const paths = events.map((event) => event.properties?.$pathname);
  expect(
    events.length === 5 && events.every((event) => event.event === PAGEVIEW_EVENT),
    `expected 5 pageviews, got ${events.length}: ${events.map((event) => event.event).join(",")}`,
  );
  expect(
    paths.join("|") === "/|/about/|/drink/kimino-yuzu/|/about/|/drink/kimino-yuzu/",
    `pageview paths were ${paths.join("|")}`,
  );
  expect(events.every((event) => event.properties?.analytics_qa === true), "QA stays true across SPA, back, and forward");
  expect(events.every((event) => event.$set === undefined && event.$set_once === undefined), "sent events have no person properties");
  const wire = JSON.stringify(events);
  expect(!wire.includes("?") && !wire.includes("#") && !wire.includes("person@") && !wire.includes("utm_"), "the sent payload has no query, hash, or campaign values");
  expect(events[0]?.properties?.$current_url === "https://stylish.sunsup.me/", "the landing pageview URL is the bare origin path");
  expect(events[0]?.properties?.$referrer === "https://news.example/story", "the landing referrer is sanitized");
  expect(events[0]?.properties?.$referring_domain === "news.example", "the landing referring domain is the hostname");
  expect(
    events.every((event) => Object.keys(event.properties ?? {}).every((key) => allowed.has(key))),
    "sent properties stay on the essential list",
  );
}

if (failures.length > 0) {
  console.error(failures.map((message) => `web-analytics-browser: ${message}`).join("\n"));
  process.exit(1);
}
process.exit(0);

function analyticsClient(mod: { posthog?: AnalyticsInit; default?: AnalyticsInit }): AnalyticsInit | null {
  if (typeof mod.posthog?.init === "function") {
    return mod.posthog;
  }
  if (typeof mod.default?.init === "function") {
    return mod.default;
  }
  return null;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function installFakeBrowser(): {
  scope: { location: { hostname: string; search: string }; sessionStorage: Storage };
  history: { pushState(state: unknown, title: string, url?: string): void; replaceState(state: unknown, title: string, url?: string): void; back(): void; forward(): void };
} {
  const listeners = new Map<string, Set<(event: Event) => void>>();
  function addEventListener(type: string, fn: EventListener) {
    const list = listeners.get(type) ?? new Set();
    list.add(fn as (event: Event) => void);
    listeners.set(type, list);
  }
  function removeEventListener(type: string, fn: EventListener) {
    listeners.get(type)?.delete(fn as (event: Event) => void);
  }
  function dispatchEvent(event: Event) {
    for (const fn of listeners.get(event.type) ?? []) {
      fn(event);
    }
    return true;
  }

  const location = {
    protocol: "https:",
    hostname: "stylish.sunsup.me",
    host: "stylish.sunsup.me",
    origin: "https://stylish.sunsup.me",
    pathname: "/",
    search: "?analytics_qa=1&email=person@example.com",
    hash: "#secret",
  };
  Object.defineProperty(location, "href", {
    get() {
      return `${location.origin}${location.pathname}${location.search}${location.hash}`;
    },
  });

  const historyStack = [location.href];
  let historyIndex = 0;
  function applyUrl(url: string) {
    const next = new URL(url, location.href);
    location.protocol = next.protocol;
    location.hostname = next.hostname;
    location.host = next.host;
    location.pathname = next.pathname;
    location.search = next.search;
    location.hash = next.hash;
  }
  const history = {
    state: null as unknown,
    pushState(state: unknown, _title: string, url?: string) {
      history.state = state;
      if (url) {
        applyUrl(url);
      }
      historyStack.splice(historyIndex + 1);
      historyStack.push(location.href);
      historyIndex = historyStack.length - 1;
    },
    replaceState(state: unknown, _title: string, url?: string) {
      history.state = state;
      if (url) {
        applyUrl(url);
      }
      historyStack[historyIndex] = location.href;
    },
    back() {
      if (historyIndex === 0) {
        return;
      }
      historyIndex -= 1;
      applyUrl(historyStack[historyIndex] as string);
      dispatchEvent(new Event("popstate"));
    },
    forward() {
      if (historyIndex >= historyStack.length - 1) {
        return;
      }
      historyIndex += 1;
      applyUrl(historyStack[historyIndex] as string);
      dispatchEvent(new Event("popstate"));
    },
  };

  const document = {
    referrer: "https://user:pass@news.example/story?utm_source=newsletter&email=person@example.com#frag",
    title: "STYLISH!",
    visibilityState: "visible",
    cookie: "",
    URL: location.href,
    readyState: "complete",
    location,
    documentElement: { scrollHeight: 100, clientHeight: 100 },
    body: { appendChild() {}, removeChild() {} },
    createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
    getElementsByTagName: () => [],
    querySelector: () => null,
    addEventListener,
    removeEventListener,
    dispatchEvent,
  };
  const window = {
    document,
    location,
    history,
    navigator: {
      userAgent: "Mozilla/5.0 (test) AppleWebKit/537.36 Chrome/120.0.0.0",
      language: "ja",
      onLine: true,
      sendBeacon: () => false,
      maxTouchPoints: 0,
    },
    screen: { width: 800, height: 600 },
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    addEventListener,
    removeEventListener,
    dispatchEvent,
    setTimeout,
    clearTimeout,
    console,
    fetch: async (url: string, opts?: { body?: unknown }) => {
      requests.push({ url: String(url), body: typeof opts?.body === "string" ? opts.body : "" });
      return { ok: true, status: 200, text: async () => "{}", json: async () => ({}) };
    },
    localStorage: browserStorage(),
    sessionStorage: browserStorage(),
    XMLHttpRequest: class {
      status = 0;
      readyState = 0;
      responseText = "";
      private url = "";
      open(_method: string, url: string) {
        this.url = url;
      }
      setRequestHeader() {}
      send(body?: unknown) {
        requests.push({ url: this.url, body: typeof body === "string" ? body : "" });
        this.status = 200;
        this.readyState = 4;
        this.responseText = "{}";
      }
    },
  };
  window.self = window;
  window.window = window;
  const globalRecord = globalThis as Record<string, unknown>;
  globalRecord.window = window;
  globalRecord.document = document;
  globalRecord.location = location;
  Object.defineProperty(globalThis, "navigator", { configurable: true, writable: true, value: window.navigator });
  globalRecord.localStorage = window.localStorage;
  globalRecord.sessionStorage = window.sessionStorage;
  globalRecord.fetch = window.fetch;
  globalRecord.XMLHttpRequest = window.XMLHttpRequest;
  return { scope: window, history };
}

function browserStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => (data.has(key) ? (data.get(key) as string) : null),
    setItem: (key, value) => {
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => {
      data.clear();
    },
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
}
