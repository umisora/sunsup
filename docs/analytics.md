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

Shop-link clicks also send a custom `outbound_click` event (Amazon, Rakuten, maker shops, and the same links the D1 `/api/click` beacon already counts). The D1 beacon is unchanged. Each click keeps `shop`, `host`, `drink_slug`, `path`, `venue` (when the page is `/ba/.../`), `position` (0-based index among shop links on the page), `source` (`page` or `list`), and `analytics_qa`, plus the same anonymous SDK fields as a pageview. It also keeps `viewport` (`narrow` when `matchMedia("(max-width: 767px)")` matches, otherwise `wide`), `headcount_changed`, and `count_table_viewed`. A link inside the shopping list also keeps `headcount` (an integer from 1 to 200) and `role` (`kanpai`, `table`, or `meal`, from `data-list-role`).

Three more events use the same filter:

- `count_table_view` — once per pathname, when at least half of the bottle-count table is visible. Properties: `venue`, `viewport`.
- `headcount_change` — one event per finished edit of the shopping-list headcount (1.5 seconds after the last step, on blur, or immediately before a store or LINE click). Skipped when the count does not change. Properties: `venue`, `headcount_from`, `headcount_to`, `method` (`step_up`, `step_down`, `type`, `mixed`), `change_index`, `table_on_page`, `viewport`.
- `list_share` — the LINE link or the copy button. Properties: `venue`, `method` (`line` or `copy`), `headcount`, `headcount_changed`, `viewport`. The shared text is not a property.

An out-of-range count, an unknown `method`, `role`, or `viewport`, or a non-boolean flag drops that event. Raw input text is not sent. These marks reset when the pathname changes. `?analytics_qa=1` marks them the same way it marks a pageview.

Manual `$pageview` captures still go through the SDK, which attaches `$pageview_id` to that pageview and to later custom events in the same view. The browser check asserts a following `outbound_click` keeps that id. `$session_id` is kept as well.

Autocapture, session replay, heatmaps, surveys, exception capture, web vitals, and `identify` are off. Events are anonymous (`person_profiles: identified_only`, and identified events are dropped).

Each pageview keeps only:

- page: `$current_url`, `$pathname`, `$host` (origin and path; no userinfo, query, or hash)
- referral: `$referrer`, `$referring_domain` (same stripping; `$direct` when there is no referrer)
- `analytics_qa` (`true` or `false`)
- the SDK fields required to accept an anonymous event: `token`, `distinct_id`, `$session_id`, `$window_id`, `$pageview_id`, `$insert_id`, `$lib`, `$lib_version`, `$time`, `$process_person_profile`, `$is_identified`

Query strings and hashes are removed from those URLs and from SDK copies such as initial URL and session-entry URL. User agent, browser, device, screen, campaign parameters, and person properties are not sent. The client does not add a city, IP address, postal code, or coordinates, and those keys are not on the allow list, so a client-supplied value is removed before send. PostHog can still attach GeoIP from the request on the server. That discard list is a project setting (IP, city, postal code, latitude, and longitude); this code does not change it. A location kept later should be limited to country and `$geoip_subdivision_1_*`.

## QA sessions

Open the production site with `?analytics_qa=1` (or `true`) on the first URL, before the first pageview is sent:

`https://stylish.sunsup.me/?analytics_qa=1`

The mark is stored in `sessionStorage` for that tab. Later pages, including back and forward, stay `analytics_qa: true` even after the parameter is gone. Reports can exclude QA with `analytics_qa` is not `true` (or equals `false`). A new tab without the parameter is `false`.

## Checks

`npm run build` runs `scripts/check-web-analytics.mts` before `next build`. That covers a missing config, the hostname guard, sanitized payloads, the QA mark, and one pageview for the landing path even when a client navigation happens before the SDK is initialized, then one pageview per later pathname change including back and forward.
