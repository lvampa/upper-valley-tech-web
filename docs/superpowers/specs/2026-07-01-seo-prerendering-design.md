# SEO via Build-Time Pre-Rendering - Design

**Date:** 2026-07-01
**Status:** Approved (pending user spec review)
**Goal:** Make Upper Valley Tech maximally legible to search engines and AI
scrapers by shipping real HTML at real URLs, with per-page metadata and rich
structured data.

## Problem

The site is a client-side-rendered Vite + React SPA using **hash routing**,
statically hosted on Cloudflare Pages. Consequences:

1. **CSR blank shell.** Shipped HTML is `<div id="app"></div>`. AI scrapers
   (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, Bytespider) mostly
   do not execute JS and therefore see no content.
2. **Hash routing** (`#/events`, `#/about`, `#/code-of-conduct`). Fragments are
   not distinct URLs to crawlers - all four screens collapse into one indexable
   URL. No per-page indexing or citation is possible.
3. **No `robots.txt`, no `sitemap.xml`.**
4. **One static title/description** for the whole site.
5. **Cargo-cult meta tags** (`ai:*`, `openai-crawler`, `perplexity-crawler`)
   that no crawler reads.
6. **Thin JSON-LD**; no `Event` structured data despite being an events org.
7. **No OG/Twitter image.**

Findings 3–7 are cosmetic until 1–2 are fixed. The architecture fix is the
foundation.

## Approach

**Build-time static pre-rendering via a custom script** (chosen over
`vite-react-ssg`): after `vite build`, `scripts/prerender.mjs` renders each
route with `react-dom/server`, injects per-route `<head>` + JSON-LD, and writes
real `dist/<route>/index.html` files. The client hydrates with `hydrateRoot`.

Rationale: the stack runs experimental `rolldown-vite`; a script that consumes
build output is robust against Vite-internal coupling, keeps the lean dependency
list intact, and fits the existing hand-rolled router. Cost: ~150 lines of
SSR/hydration/head plumbing we own and test.

Rejected alternatives:

- **`vite-react-ssg`** - less custom code but forces react-router adoption and
  deep Vite SSR coupling (rolldown-vite compatibility risk).
- **Framework migration (Astro/Next)** - best-in-class SEO defaults but a full
  rewrite of a working site; out of proportion for 4 pages.

## Components

### 1. Path-based routing (replaces hash routing)

| Screen          | Old hash            | New path           |
| --------------- | ------------------- | ------------------ |
| Home            | `#/`                | `/`                |
| Events          | `#/events`          | `/events`          |
| About           | `#/about`           | `/about`           |
| Code of Conduct | `#/code-of-conduct` | `/code-of-conduct` |

- `App.tsx` router switches from `location.hash` to `location.pathname`.
  Client-side navigation uses History API `pushState` + a `popstate` listener
  (replacing the `hashchange` listener). Scroll-to-top behavior preserved.
- `App` accepts an optional `location` prop (SSR passes the route being
  rendered; client falls back to `window.location.pathname`).
- Nav/Footer/Logo link `href`s change to real paths. The mailing-list CTA
  becomes `/#subscribe` (real fragment on home); the existing `#subscribe`
  scroll-to-EmailCapture behavior is preserved.
- `active`-state keys in `Nav` change from `#/…` to `/…`.
- Unknown paths: a pre-rendered `404.html` (Cloudflare Pages serves it
  automatically). No SPA-fallback rewrite needed because every known route is a
  real static file.

**Interface:** router maps `pathname -> Screen`; unchanged screen components.

### 2. SSR entry + client hydration

- `src/entry-server.tsx` exports `render(pathname, data)` →
  `{ html, headTags }`, calling `renderToString(<App location={pathname}
initialData={data} />)`.
- `src/main.tsx` switches `createRoot(...).render(...)` to
  `hydrateRoot(root, ...)`. Initial event data is read from an inline
  `window.__UVT_DATA__` script written by the prerender step; the client
  re-fetches live data on mount (existing `useEvents` behavior) so users always
  see current events.
- Screens/hooks must be hydration-safe: server render and first client render
  must produce identical markup given the same `initialData`.

### 3. SEO source of truth - `src/lib/seo.ts`

```
ROUTE_META: Record<Path, {
  title: string;
  description: string;
  canonical: string;         // absolute https://uppervalleytech.org/<path>
  og: { title; description; url; image; imageAlt };
  twitter: { card: 'summary_large_image'; title; description; image };
  jsonld: object | object[]; // page-appropriate schema.org
}>
```

- Consumed at **build** (serialized into each page's `<head>`) and on **client
  nav** (a small effect updates `document.title` + key meta tags on route
  change).
- Site constants (base URL, org name, founder, email, region) centralized here
  or imported from `constants.ts`.

Per-page titles/descriptions are distinct and human-written (not templated
boilerplate).

### 4. Structured data (JSON-LD)

- `/` - `WebSite` + `Organization`, enriched with `logo` (absolute URL to
  og/logo asset), `areaServed` (Upper Valley - Grafton/Sullivan County NH +
  Orange/Windsor County VT, described as the Upper Valley region of NH & VT),
  `founder` (Connor Abdelnoor), `foundingDate` (2025), `email`, and `url`.
- `/events` - `ItemList` whose items are `Event` objects built from the
  build-time events fetch: `name` (title), `startDate` (ISO date + time),
  `location` (`Place` with name), `url` (rsvpHref when present), `organizer`
  (the Organization), `eventAttendanceMode`/`eventStatus` where known.
- `/about` - `AboutPage` referencing the Organization.
- `/code-of-conduct` - `WebPage`.

All JSON-LD emitted server-side into the static HTML.

### 5. Crawler files

- `public/robots.txt` - `Allow: /` for all; explicit `Allow` blocks welcoming
  GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, Bytespider,
  Applebot-Extended; `Sitemap: https://uppervalleytech.org/sitemap.xml`.
- `sitemap.xml` - **generated by `prerender.mjs`** from the same route list used
  to render pages, so it never drifts. Written to `dist/`. Includes `lastmod`
  (the build date, from the Node build script).

### 6. Remove cargo-cult tags

Delete `ai:title`, `ai:description`, `ai:summary`, `ai:topics`, `ai:author`,
`openai-crawler`, `perplexity-crawler` from `public/metadata.html`. Their intent
is served for real by robots.txt + rich JSON-LD + semantic HTML. `metadata.html`
is reduced to the truly static, page-agnostic head (charset, viewport, icons);
per-page SEO tags come from `seo.ts` at prerender time.

### 7. OG social-card image

- Generate `public/og-image.png` at **1200×630 PNG** (PNG chosen: logo+text /
  flat-color card stays crisp; WebP avoided for unfurler-support reasons; JPG
  only wins for photos). Derived from the existing `Logo`/brand tokens.
- Emit `og:image`, `og:image:width` (1200), `og:image:height` (630),
  `og:image:type` (`image/png`), `og:image:alt`, and `twitter:card`
  = `summary_large_image` with `twitter:image`.

### 8. Events freshness - auto-rebuild

- Add a `repository_dispatch` trigger (type `events-updated`) to the deploy
  workflow so the events service can POST to the GitHub API to rebuild + redeploy
  the static snapshot when events change. Users always get live data via client
  re-fetch; the rebuild keeps the crawlable snapshot and `Event` JSON-LD fresh.
- The dispatch **sender** lives in the separate events repo - out of scope to
  implement here; the contract (event type, required token scope) is documented
  in `docs/deploy.md`.

### 9. Semantic HTML pass

Audit each screen for: exactly one `<h1>`, correct heading order, landmark
elements (`main` exists in Shell; verify `nav`/`footer`), descriptive link text,
and `alt` on the logo/images. Improves ranking and AI extraction quality.

### 10. Build pipeline

`package.json` `build` becomes: `tsc` → `vite build` (client) → `vite build
--ssr src/entry-server.tsx` → `node scripts/prerender.mjs`. The prerender step:
fetches events (from `VITE_EVENTS_API_URL`), renders every route, writes
`dist/<route>/index.html` + `dist/404.html`, injects `window.__UVT_DATA__`,
generates `dist/sitemap.xml`. `robots.txt` ships from `public/`.

Build-time events fetch failure: log a warning and render the events page shell
without baked events (graceful degradation) rather than failing the whole build.

## Data flow

```
build:
  events API --fetch--> prerender.mjs
  ROUTE_META (seo.ts) --+
  App (SSR) ------------+--> dist/<route>/index.html  (HTML + head + JSON-LD + __UVT_DATA__)
                        +--> dist/sitemap.xml
  public/robots.txt, og-image.png --copy--> dist/

runtime (browser):
  dist/<route>/index.html --> hydrateRoot(App) --> useEvents re-fetch --> live UI
```

## Error handling

- **Build-time events fetch fails:** warn, render events shell without baked
  items; build still succeeds.
- **Hydration mismatch:** prevented by feeding identical `initialData` to server
  and first client render; covered by a build smoke check.
- **Unknown route (direct hit):** `404.html`.
- **Client nav to unknown path:** router falls back to the 404 screen.

## Testing

- `seo.ts`: every route has non-empty unique `title`/`description`, absolute
  `canonical`, well-formed JSON-LD.
- Sitemap generation: contains exactly the public routes, valid XML.
- Prerender output: `dist/events/index.html` contains baked event titles and an
  `Event` JSON-LD block; `dist/index.html` contains the `Organization` block;
  `dist/robots.txt` and `dist/sitemap.xml` exist.
- Router: `pathname -> Screen` mapping incl. 404 fallback; `pushState` nav
  updates the active screen without a full reload.
- Aligns with the existing BDD regression net
  (`docs/superpowers/plans/2026-06-23-bdd-regression-net.md`).

## Out of scope

- Framework migration.
- Implementing the dispatch sender in the events repo (contract documented
  only).
- Analytics / search-console setup (operational, not code).

## Open items resolved

- Mechanism: **custom prerender script**.
- Events in HTML: **build-time snapshot + auto-rebuild webhook**.
- OG image: **generated from Logo, PNG 1200×630**.
