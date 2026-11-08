# Anonymous pageviews (PostHog)

STYLISH! can send anonymous pageviews to PostHog from the production hostname only: `stylish.sunsup.me`. The site is a static export, so the snippet is chosen when GitHub Actions runs `npm run build`. A Pages runtime variable does not reach the browser bundle.

Analytics stays off when either variable is missing or invalid. Localhost, `*.pages.dev`, and any other hostname do not load the SDK and do not send events.

## Build variables

Set both as GitHub repository **variables** (Settings → Secrets and variables → Actions → Variables), not as secrets. Use the public ingestion token from the PostHog project settings. Do not use a personal API key.

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Public ingestion token for PostHog project `340960` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` |

`.github/workflows/ci.yml` passes those variables into the Build job. The deploy job uploads the already built `out/` directory, so it does not need them. After changing a variable, the next `main` build has to succeed and deploy before production changes.

Empty variables are safe: the build still passes and the export simply does not start PostHog.

### Pages Git builds

The current pipeline does not use a Cloudflare Pages build. Pages environment variables, including build variables on the Pages project, are not read by this workflow. If production is later built by Pages itself (`npx next build`, output `out`), set the same two names as **build** environment variables on that project. Runtime-only variables are still too late.

## What is sent

One `$pageview` mechanism is enabled: the initial view, then a view only when the pathname changes (client navigations, back, and forward). Same-path `replaceState`, query changes, and hash changes do not add another view.

Autocapture, session replay, heatmaps, surveys, exception capture, web vitals, and `identify` are off. Events are anonymous (`person_profiles: identified_only`, and identified events are dropped).

Each pageview keeps only:

- page: `$current_url`, `$pathname`, `$host` (origin and path; no userinfo, query, or hash)
- referral: `$referrer`, `$referring_domain` (same stripping; `$direct` when there is no referrer)
- `analytics_qa` (`true` or `false`)
- the SDK fields required to accept an anonymous event: `token`, `distinct_id`, `$session_id`, `$window_id`, `$pageview_id`, `$insert_id`, `$lib`, `$lib_version`, `$time`, `$process_person_profile`, `$is_identified`

Query strings and hashes are removed from those URLs and from SDK copies such as initial URL and session-entry URL. User agent, browser, device, screen, campaign parameters, and person properties are not sent.

PostHog can still attach the request IP on the server. Discarding client IP is a project setting; this change does not turn it on.

## QA sessions

Open the production site with `?analytics_qa=1` (or `true`) on the first URL, before the first pageview is sent:

`https://stylish.sunsup.me/?analytics_qa=1`

The mark is stored in `sessionStorage` for that tab. Later pages, including back and forward, stay `analytics_qa: true` even after the parameter is gone. Reports can exclude QA with `analytics_qa` is not `true` (or equals `false`). A new tab without the parameter is `false`.

## Checks

`npm run build` runs `scripts/check-web-analytics.mts` before `next build`. That covers a missing config, the hostname guard, sanitized payloads, the QA mark, and one pageview for the initial load, a client navigation, back, and forward.
