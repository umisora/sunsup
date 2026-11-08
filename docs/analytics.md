# Anonymous pageviews (PostHog)

STYLISH! can send anonymous pageviews to PostHog from the production hostname only: `stylish.sunsup.me`. The site is a static export. Next.js inlines `NEXT_PUBLIC_*` while it builds the browser chunks. A Pages runtime variable does not reach that bundle.

Analytics stays off when either variable is missing or invalid. Localhost, `*.pages.dev`, and any other hostname do not load the SDK and do not send events.

## Two production build paths

Both of these can publish the `sunsup` Pages project. The deployment that finishes last is the one `stylish.sunsup.me` serves.

| Surface | What builds `out/` | What publishes production |
| --- | --- | --- |
| Cloudflare Pages Git integration | Pages runs its build on pushes to `main` and on pull requests. The project is already connected: pull request checks include **Cloudflare Pages**, and previews are served from `*.sunsup-dv4.pages.dev`. | The `main` build, using the Pages **Production** environment variables. |
| GitHub Actions | `.github/workflows/ci.yml` runs `npm run build` and passes repository variables into that build. | `wrangler pages deploy out --project-name=sunsup --branch=main`, only when repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are both set. On the latest `main` run those secrets were empty, so the deploy job was skipped. |

A Git production build without the two variables publishes JavaScript that still reads `process.env.NEXT_PUBLIC_POSTHOG_*` and therefore does not start PostHog. That deployment replaces a previous Actions upload even if the Actions build had the variables. The reverse is also true once the Actions deploy is enabled. Set the variables on every build that is allowed to publish production. Preview and Production are separate variable sets in Pages.

The Pages preview of commit `6f84cdd` (`https://f0877e47.sunsup-dv4.pages.dev`) was built by Git integration, not from the Actions artifact. Its `main-app` chunk still contains the variable names and no project token.

## Build variables

Use the public ingestion token from the PostHog project settings. Do not use a personal API key.

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Public ingestion token for PostHog project `340960` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` |

GitHub: repository **variables** (Settings → Secrets and variables → Actions → Variables), not secrets. The Build job in `.github/workflows/ci.yml` passes them through. The deploy job only uploads `out/`.

Pages: Workers & Pages → `sunsup` → Settings → Environment variables. Add both names to the **Production** build environment. Add them to **Preview** as well if preview bundles should contain the token; the hostname guard still prevents preview hosts from sending. The documented Pages build command is `npx next build` (output `out`). That is the step that inlines the variables. `npm run build` is what Actions runs; it does the same Next build after the repo checks.

Empty variables are safe: the build still passes and the export does not start PostHog.

## What is sent

One `$pageview` mechanism is enabled. The SDK chunk loads asynchronously, so the landing path and any pathname change that happens before the chunk arrives are recorded first and then sent in order. After that, a view is sent only when the pathname changes (client navigations, back, and forward). Same-path `replaceState`, query changes, and hash changes do not add another view. The SDK's own history pageview listener is off, so those navigations are not counted twice.

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

`npm run build` runs `scripts/check-web-analytics.mts` before `next build`. That covers a missing config, the hostname guard, sanitized payloads, the QA mark, and one pageview for the landing path even when a client navigation happens before the SDK is initialized, then one pageview per later pathname change including back and forward.
