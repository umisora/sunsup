import { beginWebAnalytics, type AnalyticsClient } from "./lib/web-analytics";

const pending =
  typeof window === "undefined"
    ? null
    : beginWebAnalytics(window, {
        token: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      });

// posthog-js is loaded only after the production hostname and build-time
// config checks pass, so preview hosts do not download or start it.
if (pending) {
  void import("posthog-js")
    .then((mod) => {
      const client = analyticsClient(mod);
      if (client) {
        pending.init(client);
      }
    })
    .catch(() => undefined);
}

function analyticsClient(mod: { default?: AnalyticsClient; posthog?: AnalyticsClient }): AnalyticsClient | null {
  if (typeof mod.posthog?.init === "function") {
    return mod.posthog;
  }
  if (typeof mod.default?.init === "function") {
    return mod.default;
  }
  return null;
}
