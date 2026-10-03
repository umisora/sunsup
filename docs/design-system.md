# sunsup design system

Daylight office table, modern editorial. Linen, window light, green glass, brass.
Everything lives in `design-system/`; pages only compose it and carry no CSS of their own.

```
design-system/
  styles/tokens.css   tokens (the only place raw colors and sizes are defined)
  styles/base.css     reset, body, paper grain, focus, selection
  styles/motion.css   pre-hide states for motion attributes
  styles/index.css    layer order + imports (imported once in app/layout.tsx)
  motion.ts           GSAP durations / eases / distances
  journey.ts          場 → 一杯 steps (href, number, label)
  components/*        one folder per component: Name.tsx + Name.module.css
  index.ts            public API — import from "@/design-system"
```

## Rules

1. Pages import from `@/design-system` only. No `className`, no page CSS, no inline styles.
2. Components read semantic tokens (`--surface-*`, `--text-*`, `--action-*`, `--border-*`). Raw `--palette-*` only inside tokens or where a tint is derived.
3. A new look is a new variant on a component (or a new component), not a one-off override.
4. Journey links go through `JourneyCta`. Forward is always the solid primary.
5. Anything that holds a journey CTA uses `rise` motion, never `reveal`, so it is never hidden.
6. After copy adds new kanji, run `npm run fonts`.

## Tokens

| Group | Tokens | Notes |
|---|---|---|
| Palette (locked) | `--palette-paper` `#F3EBDD`, `--palette-linen` `#FFF8EE`, `--palette-brass` `#A57B32`, `--palette-glass` `#3F6B56`, `--palette-ink` `#2C281F` | Derived: `sand`, `mist`, `brass-deep`, `brass-soft`, `glass-deep`, `sage` |
| Surface | `page` paper · `raised` linen · `frost` translucent linen + blur · `inverse` glass · `sunken` | |
| Text | `primary` `secondary` `muted` `accent` `accent-deep` `inverse` `inverse-muted` `link` | |
| Action | `primary` glass · `primary-hover` · `accent` brass disc · `focus` brass | |
| Type families | `--font-display` Shippori Mincho · `--font-text` Zen Kaku Gothic New · `--font-mark` Cormorant Garamond (italic for numerals) | self-hosted subsets in `fonts/` |
| Type scale | `--step--2` 11 · `--step--1` 13 · `--step-small` 15 · `--step-0` 16 · `--step-1`…`--step-6` fluid · `--step-mark` | display = step-5, statement = step-6 |
| Space | `--space-1`…`--space-8` (4 → 64px), `--space-9` fluid, `--space-section` fluid | |
| Layout | `--layout-wrap` 1280 · `--layout-gutter` · `--layout-bleed-inset` 12 · `--layout-grid-gap` · `--layout-header-height` 72 | breakpoints: 480 / 600 / 768 / 960 |
| Radius | `sm` 14 · `md` fluid 16–24 · `lg` fluid 20–32 · `pill` | |
| Elevation | `--shadow-float` header · `raised` cards · `lifted` hover · `action` primary button · `inverse` glass panel · `--blur-frost` | |
| Motion (CSS) | `--duration-fast` 160 · `base` 240 · `slow` 1200 · `--ease-out` | GSAP side: `design-system/motion.ts` |

## Components

| Component | Use | Key props |
|---|---|---|
| `SiteHeader` / `SiteFooter` / `SkipLink` | Layout chrome. Header is a floating frosted pill; footer has the one-liner, the fixed disclaimer, and a giant wordmark. | — |
| `Section` | Every page section. | `width` wrap · bleed · full, `space` none · sm · md · lg, `labelledBy` / `label` |
| `Grid` | Columns inside a section. Collapses at 960. | `columns` split (5/7) · splitWide (7/5) · aside (3/9) · halves · thirds · quarters, `offset` staggered rhythm, `as="ol"` |
| `Stack` | Vertical spacing between children. | `gap` 1–8 (space tokens), `align` |
| `Text` | All type. | `variant` display · statement · headline · title · prose · lead · body · small · caption · mark, `tone`, `as`, `intro` |
| `Eyebrow` · `Numeral` · `Phrase` · `TextLink` | Label with rule · Cormorant italic numbers · keep a Japanese phrase unbroken · inline link. | |
| `DisplayLines` | Page title whose lines rise out of a mask on load. | `lines`, `variant` display · mark |
| `FillText` | Statement that inks in per character on scroll. | `lines`, `variant` statement · prose |
| `Button` | Pill button. Without `href` it is a visual span for use inside a card link. | `variant` primary (glass + brass disc) · secondary (linen) · inverse (on glass), `icon` forward · back · none |
| `JourneyCta` | The only journey link. | `to` ba · drink, `direction` forward · back, `surface` light · inverse |
| `JourneySteps` | 01 場 / 02 一杯 position pill. | `current` |
| `Chip` / `ChipList` | Small pill labels. | `tone` raised · frost, `folio` |
| `Surface` | Card background. | `tone` raised · frost · inverse, `padding` md · lg · xl, `radius`, `rise` / `reveal` / `staggerItem` |
| `Photo` | Still life image from the catalog (`components/StillLife/photos.ts`). | `name`, `sizes`, `priority` (one per page), `decorative`, `position`, `narrow` art-directed crop |
| `ExternalPhoto` | Still life from a URL outside the catalog, for a drink's 静物URL. | `src`, `alt`, `priority` |
| `StillLife` | Frame for a `Photo`. | `ratio` 16:9 · 4:3 · 4:5 · 3:4 · fill, `radius` none · sm · md · lg, `fit` cover · contain, `parallax`, `intro`, `hoverZoom`, `overlay` |
| `HeroStage` | Home hero: full-bleed rounded still life under the header, frosted headline card, corner aside. | `media`, `aside`, children |
| `PageIntro` | Inner page top: steps, folio, eyebrow, masked title, lead. Split hero with `media`. `compact` drops padding so a following full-viewport stage stays in the first screen. | `step`, `folio`, `eyebrow`, `title`, `lead`, `sublead`, `media`, `compact` |
| `SectionHead` | Eyebrow + section heading. | `eyebrow`, `title`, `size`, `compact` |
| `FeatureCard` | Whole-card link to the next step. | `href`, `media`, `folio`, `eyebrow`, `title`, `body`, `action` |
| `Tile` | Bento unit, photo or text. Place in `<Grid as="ol">`. | `no`, `title`, `lines`, `media` |
| `MediaPanel` | Full-bleed still life with a frosted card. Place in `<Section width="full">`. | `media`, `cardSide` |
| `PeakStage` | Desire peak: pinned photo opening to full bleed. Headline sits in the upper calm side, clear of the sticky header, so it is whole in the first viewport. | `folio`, `media` (wide + `narrow`) |
| `ClosingPanel` | Glass-green close with actions. | `eyebrow`, `title`, `sub`, `actions` |
| `InfoRow` | Title + text card, for plain information. Title may be a link. | `title`, `muted` |
| `DrinkShelf` | Dense drink index. A still sits beside the name and size; wide shelves run two columns. No still means a text line only. | `drinks`, `opening`, `defer` |
| `StoreSlot` | One primary store button, then any further product links. Shell keeps the hidden empty 手に入れる / 近く / 読む structure. No affiliate IDs, no search URLs. | `rows` (`label`, `href`, `text`). Omit `rows` on the shell |
| `Motion` | Wrap each page once. | — |

## Motion contract

`<Motion>` runs GSAP inside `gsap.matchMedia()`; with reduced motion the page is static and fully visible. Components set these attributes, pages don't.

| Attribute | Set by | Behaviour | Hidden before it runs |
|---|---|---|---|
| `data-intro-media` | `StillLife intro` | clip-path wipe + image settle on load | yes (clip) |
| `data-line` | `DisplayLines` | lines rise from a mask on load | yes |
| `data-intro` | `intro` props | fade up on load, after lines | yes |
| `data-reveal` | `SectionHead`, `InfoRow`, `Surface reveal` | fade up once on scroll | yes |
| `data-stagger-item` | `Tile`, `Surface staggerItem` | batched card entrance (`ScrollTrigger.batch`) | yes |
| `data-rise` | `FeatureCard`, `MediaPanel`, `ClosingPanel`, `Surface rise` | slide up on scroll | **never** |
| `data-fill` | `FillText` | per-character ink, scrubbed | no (dimmed only) |
| `data-parallax` | `StillLife parallax` | image drifts ±5%, scrubbed | no |
| `data-drift` | `HeroStage` card | card drifts up as the hero leaves | no |
| `data-peak-*` | `PeakStage` | pin + clip-path open (≥768px), scrub open (narrow) | no |

## Page recipes

- `/`: `HeroStage` → `Section` + `FillText` → `Section` + `FeatureCard` → `Section` + `SectionHead` + `Grid quarters offset` of photo `Tile`s
- `/ba/office`: `PageIntro` (media) → `Section` + `Grid aside` + `FillText prose` → `Grid thirds` of `Tile`s → six category `InfoRow` links → `Section full` + `MediaPanel` with `JourneyCta to="drink"`
- `/drink/shell`: `PageIntro` (`compact`) → `PeakStage` → `Grid split` (`StillLife` + `Grid halves` of `Tile`s) → `ClosingPanel` with back `JourneyCta` + `StoreSlot` (no rows)
- `/drink/`: `PageIntro` (`compact`) → one `Section` per category. `DrinkShelf` puts each still beside its name and size, two columns once the shelf is wide, one when it is narrow. A drink without a still is a line only. Real stills are listed first
- `/drink/[slug]`: optional `ExternalPhoto` in `StillLife` (only that drink's still) → category `Chip` + product name → `InfoRow`s for 場／見た目／サイズ／味 → same-category links → `ClosingPanel` (fixed close, no second button) → `StoreSlot`: first product link is the primary button, 公式 / Amazon / 楽天 when each URL is a product page
- `/about`: `Section` + `Grid splitWide` (mark title + `Photo`) → `Stack` of `InfoRow`s
