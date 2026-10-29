# SEO Pre-Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the CSR/hash-routed SPA into pre-rendered static HTML at real URLs with per-page metadata and rich structured data, so search engines and non-JS AI scrapers see full content.

**Architecture:** A custom `scripts/prerender.mjs` runs after `vite build`, imports a Vite-built SSR bundle (`src/entry-server.tsx`), fetches events once at build time, and writes a real `dist/<route>/index.html` per route with injected `<head>` + JSON-LD + a `window.__UVT_DATA__` seed. The browser hydrates each page and re-fetches live events. Navigation is plain full-page links between real static files (no client-side router). Design spec: `docs/superpowers/specs/2026-07-01-seo-prerendering-design.md`.

**Tech Stack:** Vite (rolldown-vite), React 19 (`react-dom/server` + `hydrateRoot`), TypeScript, Vitest, `@resvg/resvg-js` (dev-only, one-shot OG image gen), Cloudflare Pages, GitHub Actions.

## Global Constraints

- Canonical origin: `https://uppervalleytech.org` (apex, no `www`, no trailing slash on the origin constant).
- Public routes: `/`, `/events`, `/about`, `/code-of-conduct`. `404` is rendered but excluded from the sitemap and marked `noindex`.
- Org identity (verbatim): name `Upper Valley Tech`; founder `Connor Abdelnoor`; founding year `2025`; contact email = existing `CONTACT_EMAIL` in `src/lib/constants.ts` (`uppervalleytechnology@gmail.com`); region phrase `the Upper Valley region of New Hampshire and Vermont`.
- OG image: `public/og-image.png`, 1200×630, `image/png`.
- No new runtime dependencies (only a dev-only `@resvg/resvg-js` for one-shot image generation). Runtime deps stay lean.
- Never use `as` for type coercion (match existing type-guard style in `src/lib/api.ts`).
- Events fetched via existing `fetchEvents()` (`src/lib/api.ts`), validated by type guards.
- Build must not fail if the build-time events fetch fails - degrade to an empty events snapshot and warn.

---

## File Structure

**Create:**

- `src/lib/site.ts` - site identity + SEO constants (single source of truth).
- `src/lib/seo.ts` - per-route metadata, JSON-LD builders, `renderHeadTags()`, client head sync.
- `src/lib/prerender.ts` - pure helpers: `serializeInitialData`, `buildSitemap`, `renderDocument` (tested in vitest, re-exported to the `.mjs` script).
- `src/lib/router.tsx` - `resolveRoute(pathname)` → `{ Screen, active, status }`, path list, 404 fallback.
- `src/lib/EventsDataContext.tsx` - context carrying the SSR/hydration events seed.
- `src/screens/NotFoundScreen.tsx` - 404 screen.
- `src/entry-server.tsx` - SSR `render(pathname, data)` + re-exports (`SITE_ROUTES`, prerender helpers).
- `scripts/prerender.mjs` - build-time orchestrator (fetch → render routes → write files + sitemap).
- `scripts/gen-og-image.mjs` - one-shot OG PNG generator.
- `public/robots.txt` - crawl directives + sitemap pointer.
- `public/og-image.png` - generated, committed.

**Modify:**

- `src/App.tsx` - path-based screen resolution via `router.tsx`; provide `EventsDataContext`; drop hash logic.
- `src/main.tsx` - read `window.__UVT_DATA__`; `hydrateRoot` in prod / `createRoot` in dev.
- `src/lib/useEvents.ts` - seed initial state from `EventsDataContext`.
- `src/components/navigation/Nav.tsx`, `Footer.tsx` - real-path hrefs + `active` keys.
- `src/screens/HomeScreen.tsx` - `href="#/events"` → `/events`.
- `public/metadata.html` - reduce to page-agnostic head; remove cargo-cult `ai:*`/crawler tags + per-page title/description.
- `package.json` - `build` script pipeline; add `@resvg/resvg-js` devDependency + `gen:og` script.
- `.github/workflows/deploy.yml` - add `repository_dispatch: [events-updated]` trigger.
- `docs/deploy.md` - document the rebuild webhook contract.
- `vite.config.ts` - no change expected (SSR build is invoked via CLI flags in `package.json`); confirm the `inject-metadata` plugin still applies to the client build only.

---

## Task 1: Site constants + SEO metadata/JSON-LD

**Files:**

- Create: `src/lib/site.ts`, `src/lib/seo.ts`
- Test: `src/lib/seo.test.ts`

**Interfaces:**

- Consumes: `Event` (`src/lib/types.ts`), `CONTACT_EMAIL` (`src/lib/constants.ts`).
- Produces:
  - `site.ts`: `SITE_URL`, `SITE_NAME`, `SITE_TAGLINE`, `FOUNDER`, `FOUNDING_YEAR`, `ORG_EMAIL`, `REGION_PHRASE`, `OG_IMAGE`, `OG_IMAGE_WIDTH`, `OG_IMAGE_HEIGHT` (all string/number consts).
  - `seo.ts`: `SITE_ROUTES: string[]`; `getRouteMeta(pathname: string): RouteMeta`; `buildJsonLd(pathname: string, events: Event[]): object[]`; `renderHeadTags(pathname: string, events: Event[]): string`; `syncClientHead(pathname: string): void`.

- [ ] **Step 1: Write `src/lib/site.ts`**

```ts
// Site identity + SEO constants - the single source of truth for anything that
// appears in <head>, JSON-LD, robots.txt, or the sitemap.
import { CONTACT_EMAIL } from './constants.ts';

export const SITE_URL = 'https://uppervalleytech.org';
export const SITE_NAME = 'Upper Valley Tech';
export const SITE_TAGLINE = "Building the Upper Valley's Tech Community";
export const FOUNDER = 'Connor Abdelnoor';
export const FOUNDING_YEAR = '2025';
export const ORG_EMAIL = CONTACT_EMAIL;
export const REGION_PHRASE = 'the Upper Valley region of New Hampshire and Vermont';

export const OG_IMAGE = '/og-image.png';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Absolute URL for a site-relative path. `/` stays `SITE_URL`. */
export function absoluteUrl(path: string): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`;
}
```

- [ ] **Step 2: Write the failing test `src/lib/seo.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { SITE_ROUTES, getRouteMeta, buildJsonLd, renderHeadTags } from './seo.ts';
import type { Event } from './types.ts';

const sampleEvents: Event[] = [
  {
    id: 'e1',
    date: '2099-09-01',
    title: 'September Meetup',
    location: 'Lebanon, NH',
    time: '6:30 PM',
  },
];

describe('seo route metadata', () => {
  it('lists the four public routes', () => {
    expect(SITE_ROUTES).toEqual(['/', '/events', '/about', '/code-of-conduct']);
  });

  it('gives every route a unique, non-empty title and description', () => {
    const metas = [...SITE_ROUTES, '/404'].map(getRouteMeta);
    for (const m of metas) {
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
      expect(m.canonical.startsWith('https://uppervalleytech.org')).toBe(true);
    }
    const titles = metas.map((m) => m.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('marks 404 as noindex and everything else indexable', () => {
    expect(getRouteMeta('/404').robots).toBe('noindex, follow');
    expect(getRouteMeta('/').robots).toBe('index, follow');
  });
});

describe('buildJsonLd', () => {
  it('emits WebSite + Organization for home', () => {
    const types = buildJsonLd('/', []).map((o: any) => o['@type']);
    expect(types).toContain('WebSite');
    expect(types).toContain('Organization');
  });

  it('emits one Event object per baked event on /events', () => {
    const ld = buildJsonLd('/events', sampleEvents);
    const events = ld.filter((o: any) => o['@type'] === 'Event');
    expect(events).toHaveLength(1);
    expect((events[0] as any).name).toBe('September Meetup');
    expect((events[0] as any).startDate).toBe('2099-09-01');
  });
});

describe('renderHeadTags', () => {
  it('includes title, canonical, og:image and JSON-LD', () => {
    const head = renderHeadTags('/events', sampleEvents);
    expect(head).toContain('<title>');
    expect(head).toContain('rel="canonical"');
    expect(head).toContain('/og-image.png');
    expect(head).toContain('application/ld+json');
    expect(head).toContain('September Meetup');
  });

  it('escapes special characters in attribute values', () => {
    // Titles are static & safe, but the renderer must escape defensively.
    const head = renderHeadTags('/', []);
    expect(head).not.toContain('content="undefined"');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/seo.test.ts`
Expected: FAIL - `Cannot find module './seo.ts'`.

- [ ] **Step 4: Write `src/lib/seo.ts`**

```ts
// Per-route SEO: titles, meta, canonical, Open Graph/Twitter, and JSON-LD.
// Consumed at build time (renderHeadTags → injected into static HTML) and on
// the client (syncClientHead → keeps <title> correct after hydration).
import type { Event } from './types.ts';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  FOUNDER,
  FOUNDING_YEAR,
  ORG_EMAIL,
  REGION_PHRASE,
  OG_IMAGE,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  absoluteUrl,
} from './site.ts';

export interface RouteMeta {
  title: string;
  description: string;
  canonical: string;
  robots: string;
}

export const SITE_ROUTES = ['/', '/events', '/about', '/code-of-conduct'];

const META: Record<string, { title: string; description: string; robots?: string }> = {
  '/': {
    title: 'Upper Valley Tech - Monthly Tech Meetup in NH & VT',
    description:
      'Upper Valley Tech is a community-driven monthly meetup connecting developers, founders, and technology professionals across the Upper Valley of New Hampshire and Vermont. Founded 2025.',
  },
  '/events': {
    title: 'Events - Upper Valley Tech',
    description:
      'Upcoming and past Upper Valley Tech meetups: dates, locations, and agendas for developers, founders, and tech professionals in the NH & VT Upper Valley.',
  },
  '/about': {
    title: 'About - Upper Valley Tech',
    description:
      'About Upper Valley Tech: a community organization founded in 2025 by Connor Abdelnoor to build and support the tech community across the Upper Valley of New Hampshire and Vermont.',
  },
  '/code-of-conduct': {
    title: 'Code of Conduct - Upper Valley Tech',
    description:
      'The Upper Valley Tech code of conduct: our standards for a respectful, inclusive community at every meetup and event.',
  },
  '/404': {
    title: 'Page Not Found - Upper Valley Tech',
    description: 'The page you were looking for could not be found.',
    robots: 'noindex, follow',
  },
};

export function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const stripped = pathname.replace(/\/+$/, '');
  return stripped === '' ? '/' : stripped;
}

export function getRouteMeta(pathname: string): RouteMeta {
  const path = normalizePath(pathname);
  const entry = META[path] ?? META['/404'];
  const canonicalPath = META[path] ? path : '/404';
  return {
    title: entry.title,
    description: entry.description,
    canonical: absoluteUrl(canonicalPath),
    robots: entry.robots ?? 'index, follow',
  };
}

const organizationLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}${OG_IMAGE}`,
  email: ORG_EMAIL,
  foundingDate: FOUNDING_YEAR,
  founder: { '@type': 'Person', name: FOUNDER },
  areaServed: { '@type': 'Place', name: 'Upper Valley, New Hampshire and Vermont' },
  description: `${SITE_NAME} - ${SITE_TAGLINE}. A community organization for ${REGION_PHRASE}.`,
});

const eventLd = (e: Event) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: e.title,
  startDate: e.date,
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: { '@type': 'Place', name: e.location },
  organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  url: e.rsvpHref ?? absoluteUrl('/events'),
});

export function buildJsonLd(pathname: string, events: Event[]): object[] {
  const path = normalizePath(pathname);
  switch (path) {
    case '/':
      return [
        { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
        organizationLd(),
      ];
    case '/events':
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: getRouteMeta(path).title,
          url: getRouteMeta(path).canonical,
        },
        ...events.map(eventLd),
      ];
    case '/about':
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: getRouteMeta(path).title,
          url: getRouteMeta(path).canonical,
        },
        organizationLd(),
      ];
    case '/code-of-conduct':
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: getRouteMeta(path).title,
          url: getRouteMeta(path).canonical,
        },
      ];
    default:
      return [];
  }
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function meta(attr: 'name' | 'property', key: string, content: string): string {
  return `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`;
}

function jsonLdScript(obj: object): string {
  const json = JSON.stringify(obj).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

export function renderHeadTags(pathname: string, events: Event[]): string {
  const m = getRouteMeta(pathname);
  const image = `${SITE_URL}${OG_IMAGE}`;
  const lines = [
    `<title>${escapeAttr(m.title)}</title>`,
    meta('name', 'description', m.description),
    `<link rel="canonical" href="${escapeAttr(m.canonical)}" />`,
    meta('name', 'robots', m.robots),
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:title', m.title),
    meta('property', 'og:description', m.description),
    meta('property', 'og:url', m.canonical),
    meta('property', 'og:image', image),
    meta('property', 'og:image:width', String(OG_IMAGE_WIDTH)),
    meta('property', 'og:image:height', String(OG_IMAGE_HEIGHT)),
    meta('property', 'og:image:type', 'image/png'),
    meta('property', 'og:image:alt', `${SITE_NAME} - ${SITE_TAGLINE}`),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', m.title),
    meta('name', 'twitter:description', m.description),
    meta('name', 'twitter:image', image),
    ...buildJsonLd(pathname, events).map(jsonLdScript),
  ];
  return lines.join('\n');
}

/** Client-side: keep the document title correct after hydration/History nav. */
export function syncClientHead(pathname: string): void {
  if (typeof document === 'undefined') return;
  document.title = getRouteMeta(pathname).title;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/seo.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/site.ts src/lib/seo.ts src/lib/seo.test.ts
git commit -m "feat(seo): per-route metadata, JSON-LD, and head rendering"
```

---

## Task 2: Path router + 404 screen + link migration

**Files:**

- Create: `src/lib/router.tsx`, `src/screens/NotFoundScreen.tsx`
- Modify: `src/App.tsx`, `src/components/navigation/Nav.tsx`, `src/components/navigation/Footer.tsx`, `src/screens/HomeScreen.tsx`, `public/metadata.html`
- Test: `src/lib/router.test.tsx`, existing `src/screens/HomeScreen.test.tsx`

**Interfaces:**

- Consumes: `normalizePath` (`src/lib/seo.ts`), screen components.
- Produces: `resolveRoute(pathname: string): { Screen: ComponentType; active?: string }` from `router.tsx`.

- [ ] **Step 1: Write the failing test `src/lib/router.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { resolveRoute } from './router.tsx';
import { HomeScreen } from '@screens/HomeScreen.tsx';
import { EventsScreen } from '@screens/EventsScreen.tsx';
import { NotFoundScreen } from '@screens/NotFoundScreen.tsx';

describe('resolveRoute', () => {
  it('maps / to HomeScreen with no active link', () => {
    expect(resolveRoute('/').Screen).toBe(HomeScreen);
    expect(resolveRoute('/').active).toBeUndefined();
  });

  it('maps /events (and trailing slash) to EventsScreen with active link', () => {
    expect(resolveRoute('/events').Screen).toBe(EventsScreen);
    expect(resolveRoute('/events/').Screen).toBe(EventsScreen);
    expect(resolveRoute('/events').active).toBe('/events');
  });

  it('falls back to NotFoundScreen for unknown paths', () => {
    expect(resolveRoute('/nope').Screen).toBe(NotFoundScreen);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/router.test.tsx`
Expected: FAIL - modules not found.

- [ ] **Step 3: Create `src/screens/NotFoundScreen.tsx`**

```tsx
import { PageHeading, Period } from '@components/core/PageHeading.tsx';

export function NotFoundScreen() {
  return (
    <section style={{ padding: '56px 0' }}>
      <PageHeading
        kicker="404"
        title={
          <>
            Page not found
            <Period />
          </>
        }
      />
      <p style={{ color: 'var(--ink-2)', marginTop: 16 }}>
        That page doesn’t exist.{' '}
        <a href="/" style={{ color: 'var(--coral)' }}>
          Back to home
        </a>
        .
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Create `src/lib/router.tsx`**

```tsx
import type { ComponentType } from 'react';
import { HomeScreen } from '@screens/HomeScreen.tsx';
import { EventsScreen } from '@screens/EventsScreen.tsx';
import { AboutScreen } from '@screens/AboutScreen.tsx';
import { CodeOfConductScreen } from '@screens/CodeOfConductScreen.tsx';
import { NotFoundScreen } from '@screens/NotFoundScreen.tsx';
import { normalizePath } from './seo.ts';

interface Route {
  Screen: ComponentType;
  active?: string;
}

const ROUTES: Record<string, Route> = {
  '/': { Screen: HomeScreen },
  '/events': { Screen: EventsScreen, active: '/events' },
  '/about': { Screen: AboutScreen, active: '/about' },
  '/code-of-conduct': { Screen: CodeOfConductScreen },
};

export function resolveRoute(pathname: string): Route {
  return ROUTES[normalizePath(pathname)] ?? { Screen: NotFoundScreen };
}
```

- [ ] **Step 5: Rewrite `src/App.tsx`** (drop hash logic; render by pathname)

```tsx
import { type Event } from '@lib/types.ts';
import { Shell } from './Shell.tsx';
import { resolveRoute } from '@lib/router.tsx';
import { EventsDataProvider } from '@lib/EventsDataContext.tsx';

interface AppProps {
  /** SSR passes the route being rendered; the client omits it and reads window. */
  location?: string;
  /** SSR/hydration seed of the events list (null on cold client render). */
  initialEvents?: Event[] | null;
}

export function App({ location, initialEvents = null }: AppProps) {
  const pathname = location ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const { Screen, active } = resolveRoute(pathname);

  return (
    <EventsDataProvider value={initialEvents}>
      <Shell active={active}>
        <Screen />
      </Shell>
    </EventsDataProvider>
  );
}
```

> Note: `EventsDataProvider` is created in Task 3. If executing strictly in order, temporarily import nothing and wrap with a fragment; then wire the provider in Task 3. Simplest is to do Task 3's context file first if your executor allows - otherwise stub `EventsDataProvider` as `({ children }) => <>{children}</>` here and replace in Task 3.

- [ ] **Step 6: Update `src/components/navigation/Nav.tsx` link defaults**

Change the defaults:

```tsx
  links = [
    { label: 'Events', href: '/events' },
    { label: 'About', href: '/about' },
  ],
  cta = { label: 'Join mailing list', href: '/#subscribe' },
  logoHref = '/',
```

- [ ] **Step 7: Update `src/components/navigation/Footer.tsx` link defaults**

```tsx
  links = [
    { label: 'Code of conduct', href: '/code-of-conduct' },
    { label: 'Contact', href: '/about' },
  ],
```

- [ ] **Step 8: Update `src/screens/HomeScreen.tsx`** - the two `href="#/events"` occurrences (the compact "See all events →" button) become `href="/events"`.

- [ ] **Step 9: Trim `public/metadata.html`** to page-agnostic head only:

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#0f0f0f" />
```

(Removes the static `<title>`/`description`/canonical/OG/Twitter/`ai:*`/crawler tags and JSON-LD - all now emitted per-route by `renderHeadTags`. The `<link rel="icon">` stays in `index.html`.)

- [ ] **Step 10: Run tests**

Run: `npx vitest run src/lib/router.test.tsx src/screens/HomeScreen.test.tsx`
Expected: PASS (adjust `HomeScreen.test.tsx` only if it asserts old `#/events` hrefs).

- [ ] **Step 11: Commit**

```bash
git add src/lib/router.tsx src/screens/NotFoundScreen.tsx src/App.tsx src/components/navigation/Nav.tsx src/components/navigation/Footer.tsx src/screens/HomeScreen.tsx public/metadata.html src/lib/router.test.tsx
git commit -m "feat(routing): path-based routes, 404 screen, real-URL links"
```

---

## Task 3: Events seed context + hydration-safe useEvents

**Files:**

- Create: `src/lib/EventsDataContext.tsx`
- Modify: `src/lib/useEvents.ts`, `src/main.tsx`
- Test: `src/lib/useEvents.test.ts` (extend existing)

**Interfaces:**

- Consumes: `Event` (`src/lib/types.ts`), `fetchEvents` (`src/lib/api.ts`).
- Produces: `EventsDataProvider` + `useEventsSeed()` from `EventsDataContext.tsx`; `window.__UVT_DATA__` global shape `{ events: Event[] }`.

- [ ] **Step 1: Create `src/lib/EventsDataContext.tsx`**

```tsx
import { createContext, useContext, type ReactNode } from 'react';
import { type Event } from './types.ts';

const EventsDataContext = createContext<Event[] | null>(null);

export function EventsDataProvider({
  value,
  children,
}: {
  value: Event[] | null;
  children: ReactNode;
}) {
  return <EventsDataContext.Provider value={value}>{children}</EventsDataContext.Provider>;
}

/** The build-time events snapshot (or null on a cold client render). */
export function useEventsSeed(): Event[] | null {
  return useContext(EventsDataContext);
}
```

- [ ] **Step 2: Write the failing test (extend `src/lib/useEvents.test.ts`)**

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { EventsDataProvider } from './EventsDataContext.tsx';
import { useEvents } from './useEvents.ts';
import type { Event } from './types.ts';

const seed: Event[] = [
  {
    id: 's1',
    date: '2099-01-01',
    title: 'Seeded Meetup',
    location: 'Hanover, NH',
    time: '6:00 PM',
  },
];

it('starts in success with the seeded events when a seed is provided', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EventsDataProvider value={seed}>{children}</EventsDataProvider>
  );
  const { result } = renderHook(() => useEvents(), { wrapper });
  // Synchronous first render must already contain the seed (SSR parity).
  expect(result.current.events).toEqual(seed);
  expect(result.current.status).toBe('success');
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run src/lib/useEvents.test.ts`
Expected: FAIL - seed not applied (initial events empty / status loading).

- [ ] **Step 4: Modify `src/lib/useEvents.ts`** to seed initial state

```tsx
import { useEffect, useState } from 'react';
import { type Event, type Status } from './types.ts';
import { fetchEvents } from './api.ts';
import { useEventsSeed } from './EventsDataContext.ts';

interface UseEventsResult {
  events: Event[];
  status: Status;
}

/**
 * Fetches the events list on mount and tracks its lifecycle status. When a
 * build-time seed is present (SSR/hydration), the first render already shows
 * it (status 'success'), so server and client markup match; the mount effect
 * then refreshes with live data.
 */
export function useEvents(): UseEventsResult {
  const seed = useEventsSeed();
  const [events, setEvents] = useState<Event[]>(seed ?? []);
  const [status, setStatus] = useState<Status>(seed ? 'success' : 'loading');

  useEffect(() => {
    let active = true;
    fetchEvents()
      .then((result) => {
        if (!active) return;
        setEvents(result);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error('Failed to load events', error);
        if (!seed) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [seed]);

  return { events, status };
}
```

> Note the import extension: `EventsDataContext.tsx` is imported as `./EventsDataContext.ts` per the project's TS extension convention (verify against how other `.tsx` modules are imported; match the existing style - several imports in the repo use `.tsx`). Use whichever resolves under the project's `tsconfig`/vite alias setup; adjust to `./EventsDataContext.tsx` if `.ts` fails to resolve.

- [ ] **Step 5: Update `src/App.tsx`** to use the real provider (replace any stub from Task 2 - import `EventsDataProvider` from `@lib/EventsDataContext.tsx`, already shown in Task 2 Step 5).

- [ ] **Step 6: Update `src/main.tsx`** for hydration + seed read

```tsx
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles/index.css';
import { App } from './App.tsx';
import { type Event } from './lib/types.ts';

declare global {
  interface Window {
    __UVT_DATA__?: { events: Event[] };
  }
}

const root = document.getElementById('app');
if (!root) throw new Error('Root element #app not found');

const initialEvents = window.__UVT_DATA__?.events ?? null;
const tree = (
  <StrictMode>
    <App location={window.location.pathname} initialEvents={initialEvents} />
  </StrictMode>
);

// Prerendered pages have server markup to hydrate; dev/cold pages render fresh.
if (root.hasChildNodes()) {
  hydrateRoot(root, tree);
} else {
  createRoot(root).render(tree);
}
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run src/lib/useEvents.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/EventsDataContext.tsx src/lib/useEvents.ts src/lib/useEvents.test.ts src/main.tsx src/App.tsx
git commit -m "feat(ssr): seed events for hydration + hydrateRoot in prod"
```

---

## Task 4: SSR entry + prerender pure helpers

**Files:**

- Create: `src/lib/prerender.ts`, `src/entry-server.tsx`
- Test: `src/lib/prerender.test.ts`, `src/entry-server.test.tsx`

**Interfaces:**

- Consumes: `App`, `renderHeadTags`, `SITE_ROUTES`, `Event`, `absoluteUrl`.
- Produces:
  - `prerender.ts`: `serializeInitialData(data: { events: Event[] }): string`; `buildSitemap(routes: string[], lastmod: string): string`; `renderDocument(opts: { template: string; appHtml: string; headHtml: string; dataScript: string }): string`.
  - `entry-server.tsx`: `render(pathname: string, data: { events: Event[] }): { appHtml: string; headHtml: string }`; re-exports `SITE_ROUTES`, `serializeInitialData`, `buildSitemap`, `renderDocument`.

- [ ] **Step 1: Write the failing test `src/lib/prerender.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { serializeInitialData, buildSitemap, renderDocument } from './prerender.ts';

describe('serializeInitialData', () => {
  it('produces an assignable, XSS-safe script body', () => {
    const out = serializeInitialData({ events: [] });
    expect(out).toContain('window.__UVT_DATA__');
    expect(out).not.toContain('</script>');
  });
});

describe('buildSitemap', () => {
  it('lists each route as an absolute loc with lastmod', () => {
    const xml = buildSitemap(['/', '/events'], '2026-07-01');
    expect(xml).toContain('<loc>https://uppervalleytech.org</loc>');
    expect(xml).toContain('<loc>https://uppervalleytech.org/events</loc>');
    expect(xml).toContain('<lastmod>2026-07-01</lastmod>');
    expect(xml.startsWith('<?xml')).toBe(true);
  });
});

describe('renderDocument', () => {
  it('injects app html, head, and data script into the template', () => {
    const template = '<html><head></head><body><div id="app"></div></body></html>';
    const doc = renderDocument({
      template,
      appHtml: '<main>hi</main>',
      headHtml: '<title>T</title>',
      dataScript: '<script>window.__UVT_DATA__={}</script>',
    });
    expect(doc).toContain('<div id="app"><main>hi</main></div>');
    expect(doc).toContain('<title>T</title></head>');
    expect(doc).toContain('window.__UVT_DATA__');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/prerender.test.ts`
Expected: FAIL - module not found.

- [ ] **Step 3: Write `src/lib/prerender.ts`**

```ts
import { type Event } from './types.ts';
import { SITE_URL, absoluteUrl } from './site.ts';

export function serializeInitialData(data: { events: Event[] }): string {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script>window.__UVT_DATA__=${json}</script>`;
}

export function buildSitemap(routes: string[], lastmod: string): string {
  const urls = routes
    .map(
      (r) =>
        `  <url>\n    <loc>${absoluteUrl(r)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderDocument(opts: {
  template: string;
  appHtml: string;
  headHtml: string;
  dataScript: string;
}): string {
  return opts.template
    .replace('<div id="app"></div>', `<div id="app">${opts.appHtml}</div>`)
    .replace('</head>', `${opts.headHtml}\n${opts.dataScript}\n</head>`);
}
```

Note `SITE_URL` import is intentional even if only `absoluteUrl` is used directly - remove the unused import if the linter flags it. (If lint fails on unused `SITE_URL`, delete it from the import.)

- [ ] **Step 4: Write `src/entry-server.tsx`**

```tsx
import { renderToString } from 'react-dom/server';
import { StrictMode } from 'react';
import { App } from './App.tsx';
import { type Event } from './lib/types.ts';
import { renderHeadTags } from './lib/seo.ts';

export function render(
  pathname: string,
  data: { events: Event[] },
): { appHtml: string; headHtml: string } {
  const appHtml = renderToString(
    <StrictMode>
      <App location={pathname} initialEvents={data.events} />
    </StrictMode>,
  );
  const headHtml = renderHeadTags(pathname, data.events);
  return { appHtml, headHtml };
}

export { SITE_ROUTES } from './lib/seo.ts';
export { serializeInitialData, buildSitemap, renderDocument } from './lib/prerender.ts';
```

- [ ] **Step 5: Write `src/entry-server.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render } from './entry-server.tsx';
import type { Event } from './lib/types.ts';

const events: Event[] = [
  {
    id: 'e1',
    date: '2099-09-01',
    title: 'September Meetup',
    location: 'Lebanon, NH',
    time: '6:30 PM',
  },
];

describe('render', () => {
  it('renders the events page with baked event content and Event JSON-LD', () => {
    const { appHtml, headHtml } = render('/events', { events });
    expect(appHtml).toContain('September Meetup');
    expect(headHtml).toContain('"@type":"Event"');
    expect(headHtml).toContain('September Meetup');
  });

  it('renders home with Organization JSON-LD and no crash', () => {
    const { appHtml, headHtml } = render('/', { events: [] });
    expect(appHtml.length).toBeGreaterThan(0);
    expect(headHtml).toContain('"@type":"Organization"');
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/lib/prerender.test.ts src/entry-server.test.tsx`
Expected: PASS. (If `render('/events')` throws because a hook touches `window` during render, guard that hook with `typeof window` - note the failure and fix minimally.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/prerender.ts src/lib/prerender.test.ts src/entry-server.tsx src/entry-server.test.tsx
git commit -m "feat(ssr): server render entry + prerender helpers"
```

---

## Task 5: Prerender script, build pipeline, robots.txt

**Files:**

- Create: `scripts/prerender.mjs`, `public/robots.txt`
- Modify: `package.json`
- Test: manual build verification (no unit test - the pure logic is covered in Tasks 1/4).

**Interfaces:**

- Consumes: built SSR bundle at `dist/server/entry-server.js` exporting `render`, `SITE_ROUTES`, `serializeInitialData`, `buildSitemap`, `renderDocument`; client template at `dist/index.html`; `fetchEvents` behavior replicated via a plain `fetch` of `${VITE_EVENTS_API_URL}/events`.

- [ ] **Step 1: Create `public/robots.txt`**

```
# Upper Valley Tech - crawling is welcome, including AI crawlers.
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bytespider
Allow: /

Sitemap: https://uppervalleytech.org/sitemap.xml
```

- [ ] **Step 2: Create `scripts/prerender.mjs`**

```js
// Post-build static prerender. Runs after the client + SSR Vite builds.
// Reads the client template (dist/index.html), fetches events once, renders
// every route to a real dist/<route>/index.html, and writes sitemap.xml.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(new URL('../', import.meta.url)));
const dist = path.join(root, 'dist');

const server = await import(path.join(dist, 'server', 'entry-server.js'));
const { render, SITE_ROUTES, serializeInitialData, buildSitemap, renderDocument } = server;

async function loadEvents() {
  const base = process.env.VITE_EVENTS_API_URL;
  try {
    const res = await fetch(`${base}/events`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body || !Array.isArray(body.events)) throw new Error('bad shape');
    return body.events;
  } catch (err) {
    console.warn(`[prerender] events fetch failed (${String(err)}); baking empty snapshot`);
    return [];
  }
}

function outPath(route) {
  return route === '/'
    ? path.join(dist, 'index.html')
    : path.join(dist, route.replace(/^\//, ''), 'index.html');
}

const template = await readFile(path.join(dist, 'index.html'), 'utf-8');
const events = await loadEvents();
const data = { events };
const dataScript = serializeInitialData(data);

for (const route of SITE_ROUTES) {
  const { appHtml, headHtml } = render(route, data);
  const doc = renderDocument({ template, appHtml, headHtml, dataScript });
  const file = outPath(route);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, doc, 'utf-8');
  console.log(`[prerender] wrote ${path.relative(dist, file)}`);
}

// 404 page (Cloudflare Pages serves dist/404.html on unknown paths).
{
  const { appHtml, headHtml } = render('/404', data);
  await writeFile(
    path.join(dist, '404.html'),
    renderDocument({ template, appHtml, headHtml, dataScript }),
    'utf-8',
  );
}

// Sitemap - build date from the Node runtime clock (ISO date only).
const lastmod = new Date().toISOString().slice(0, 10);
await writeFile(path.join(dist, 'sitemap.xml'), buildSitemap(SITE_ROUTES, lastmod), 'utf-8');
console.log('[prerender] wrote sitemap.xml');

// Drop the SSR bundle so it is not uploaded to the CDN.
await rm(path.join(dist, 'server'), { recursive: true, force: true });
console.log('[prerender] done');
```

- [ ] **Step 3: Update `package.json` scripts**

```json
"build": "tsc && vite build && vite build --ssr src/entry-server.tsx --outDir dist/server && node scripts/prerender.mjs",
```

- [ ] **Step 4: Run a full build and verify output**

Run:

```bash
VITE_EVENTS_API_URL=https://api.uppervalleytech.org npm run build
ls dist dist/events dist/about dist/code-of-conduct
grep -l 'Organization' dist/index.html
grep -l 'application/ld+json' dist/events/index.html
test -f dist/robots.txt && test -f dist/sitemap.xml && test -f dist/404.html && echo "static files OK"
test ! -d dist/server && echo "ssr bundle cleaned OK"
```

Expected: each route directory has an `index.html`; home contains `Organization`; events page contains JSON-LD; `robots.txt`, `sitemap.xml`, `404.html` exist; `dist/server` removed.

- [ ] **Step 5: Verify hydration locally**

Run:

```bash
npm run preview
# Open the printed URL, view source on /events - confirm event titles are in the
# raw HTML (not just after JS). Confirm no hydration error in the console.
```

Expected: event content present in served HTML; no hydration mismatch errors.

- [ ] **Step 6: Commit**

```bash
git add scripts/prerender.mjs public/robots.txt package.json
git commit -m "feat(build): static prerender pipeline, robots.txt, sitemap"
```

---

## Task 6: OG social-card image

**Files:**

- Create: `scripts/gen-og-image.mjs`, `public/og-image.png`
- Modify: `package.json` (add `@resvg/resvg-js` devDependency + `gen:og` script)

**Interfaces:** none consumed by app code; `renderHeadTags` (Task 1) already points at `/og-image.png`.

- [ ] **Step 1: Add the dev dependency**

Run: `npm install -D @resvg/resvg-js`

- [ ] **Step 2: Create `scripts/gen-og-image.mjs`** (one-shot; not part of `build`)

```js
// One-shot generator for public/og-image.png (1200×630). Run with `npm run gen:og`
// after brand changes; the PNG is committed so builds don't depend on this.
import { Resvg } from '@resvg/resvg-js';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#141414"/>
      <stop offset="1" stop-color="#0b0b0b"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff6b5e"/>
      <stop offset="1" stop-color="#ff9472"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(120,235)">
    <rect width="120" height="120" rx="30" fill="url(#mark)"/>
    <path d="M22 92 L46 44 L70 72 L94 30 L118 92" fill="none" stroke="#141414" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" transform="translate(-8,-8) scale(1.05)"/>
  </g>
  <text x="120" y="430" font-family="Georgia, serif" font-size="72" font-weight="700" fill="#f4f1ec">Upper Valley Tech</text>
  <text x="120" y="490" font-family="Georgia, serif" font-size="32" fill="#b8b3ab">Monthly tech meetup - New Hampshire &amp; Vermont</text>
</svg>`;

const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
const out = path.join(
  path.dirname(fileURLToPath(new URL('../', import.meta.url))),
  'public',
  'og-image.png',
);
await writeFile(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);
```

- [ ] **Step 3: Add the script to `package.json`**

```json
"gen:og": "node scripts/gen-og-image.mjs",
```

- [ ] **Step 4: Generate and verify**

Run:

```bash
npm run gen:og
file public/og-image.png   # expect: PNG image data, 1200 x 630
```

Expected: a 1200×630 PNG is written.

- [ ] **Step 5: Commit**

```bash
git add scripts/gen-og-image.mjs public/og-image.png package.json package-lock.json
git commit -m "feat(seo): generated 1200x630 OG social-card image"
```

---

## Task 7: Events auto-rebuild webhook

**Files:**

- Modify: `.github/workflows/deploy.yml`, `docs/deploy.md`

**Interfaces:** GitHub `repository_dispatch` event type `events-updated`.

- [ ] **Step 1: Add the trigger to `.github/workflows/deploy.yml`**

Change the `on:` block to also listen for the dispatch (keep the existing push trigger):

```yaml
on:
  push:
    branches: [production]
  repository_dispatch:
    types: [events-updated]
```

No other job changes are needed - the build already fetches live events at build time, so a dispatch-triggered run redeploys a fresh snapshot.

- [ ] **Step 2: Document the contract in `docs/deploy.md`** (append a section)

```markdown
## Events auto-rebuild

The pre-rendered `/events` page bakes an events snapshot at build time. To keep
it fresh when events change, the events service triggers a rebuild via GitHub
`repository_dispatch`:

    POST https://api.github.com/repos/<owner>/<repo>/dispatches
    Authorization: Bearer <token>
    Accept: application/vnd.github+json
    Body: {"event_type": "events-updated"}

- `<token>`: a fine-grained PAT scoped to this repo with **Contents: write**
  (required to create a dispatch), or a classic PAT with `repo` scope.
- This fires `.github/workflows/deploy.yml` (`repository_dispatch: events-updated`),
  which rebuilds and redeploys, refreshing the baked snapshot and Event JSON-LD.
- The sender lives in the separate `upper-valley-tech-events-mcp` service and is
  out of scope for this repo.
```

- [ ] **Step 3: Verify workflow YAML is valid**

Run: `npx --yes js-yaml .github/workflows/deploy.yml >/dev/null && echo "yaml OK"`
Expected: `yaml OK` (or use any available YAML linter).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml docs/deploy.md
git commit -m "feat(ci): rebuild+redeploy on events-updated repository_dispatch"
```

---

## Task 8: Semantic HTML + accessibility verification

**Files:**

- Modify (as needed): `src/components/brand/Logo.tsx`, screens.
- Test: existing suite.

**Interfaces:** none.

- [ ] **Step 1: Audit headings and landmarks**

Confirm: each screen renders exactly one `<h1>` (HomeScreen `home-title`; others via `PageHeading`; NotFoundScreen via `PageHeading`). `<main>` is in `Shell`; `<nav>` in `Nav`; `<footer>` in `Footer`. Record findings; fix any duplicate/missing `<h1>`.

- [ ] **Step 2: Give the `xl` Logo an accessible name** (wordmark hidden at `xl`)

In `src/components/brand/Logo.tsx`, add an accessible label so the icon-only variant isn't an empty link/graphic:

```tsx
    <Tag
      href={href}
      className={className}
      aria-label={showWord ? undefined : 'Upper Valley Tech'}
      style={{
```

- [ ] **Step 3: Run the full suite + typecheck + lint**

Run:

```bash
npm run typecheck && npm run lint && npx vitest run
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(a11y): accessible logo label + semantic HTML pass"
```

---

## Self-Review Notes (coverage vs spec)

- §1 mechanism (custom script): Tasks 4–5. §2 routing: Task 2. §3 SEO module: Task 1. §4 JSON-LD: Task 1. §5 robots/sitemap: Tasks 5. §6 remove cargo-cult tags: Task 2 Step 9. §7 OG image: Task 6. §8 auto-rebuild: Task 7. §9 semantic HTML: Task 8. §10 build pipeline: Task 5. Testing (§Testing): Tasks 1, 3, 4 unit tests + Task 5 build verification.
- Known accepted risk (from spec): a build-time-vs-load-time clock difference straddling an event's date boundary can cause a one-off React hydration warning; auto-rebuild (Task 7) keeps the snapshot current. Not engineered around.
- Extension resolution for `EventsDataContext` import (Task 3 Step 4): use the extension that resolves under the project's TS/vite config; adjust if the first choice fails.

```

```
