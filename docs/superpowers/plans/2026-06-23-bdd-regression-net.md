# BDD Regression-Net Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a behavior-driven (Given/When/Then) regression test net covering the website's pure logic + components and the events service's endpoints, DB, and authorization gate.

**Architecture:** Two self-contained Vitest setups — the site (`/`) uses jsdom + React Testing Library; the service (`events-service/`) uses `@cloudflare/vitest-pool-workers` against a real local D1. A root `test:all` runs both. Tests characterize _existing_ behavior (they pass against current correct code), so the normal TDD "red first" is replaced by "write test → run → verify PASS", with a final task proving the net has teeth by breaking code on purpose.

**Tech Stack:** Vitest, @testing-library/react + jest-dom + jsdom, @cloudflare/vitest-pool-workers, Zod (already present), rolldown-vite.

**Spec:** `docs/superpowers/specs/2026-06-23-bdd-regression-net-design.md`

---

## File Structure

**Site (`/`):**

- Create `vitest.config.ts` — Vitest config reusing `vite.config.ts` (aliases + react plugin), jsdom env.
- Create `vitest.setup.ts` — registers jest-dom matchers.
- Create `src/data/events.test.ts` — selector + date behaviors.
- Create `src/lib/api.test.ts` — `fetchEvents` validation behaviors.
- Create `src/lib/useEvents.test.ts` — hook lifecycle.
- Create `src/components/events/EventCard.test.tsx` — variant rendering.
- Create `src/screens/HomeScreen.test.tsx` — loading/error/success states.
- Modify `package.json` — test scripts + dev deps.
- Modify `eslint.config.js` — relax a few rules for `*.test.*` + setup.

**Service (`events-service/`):**

- Create `vitest.config.ts` — `defineWorkersConfig`, bindings from `wrangler.jsonc`.
- Create `test/env.d.ts` — `cloudflare:test` types + `ProvidedEnv`.
- Create `test/helpers.ts` — `resetDb(env)`, `seedEvent(env, …)`, `seedOrganizer(env, …)`.
- Create `src/operations.ts` — injectable-email tool operations (the testable seam).
- Modify `src/mcp.ts` — tools delegate to `operations.ts`.
- Create `src/operations.test.ts` — auth gate + validation behaviors.
- Create `src/db.test.ts` — row mapping + patch building.
- Create `src/events-endpoint.test.ts` — `GET /events` behaviors.
- Modify `package.json` — test scripts + dev deps; `tsconfig.json` — include `test`.

---

## Task 1: Site test harness

**Files:**

- Modify: `package.json`
- Create: `vitest.config.ts`, `vitest.setup.ts`, `src/smoke.test.ts` (temporary)

- [ ] **Step 1: Install site test deps**

Run:

```bash
cd /Users/connor/upper-valley-tech
npm install -D vitest @testing-library/react @testing-library/dom @testing-library/jest-dom jsdom
```

Expected: installs succeed.

- [ ] **Step 2: Create the Vitest config (reuses vite aliases + react plugin)**

Create `vitest.config.ts`:

```ts
import { mergeConfig, defineConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

// Reuse the app's vite config (path aliases @components/@lib/@data/@screens and
// the react plugin) so tests resolve imports exactly like the app does.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
    },
  }),
);
```

- [ ] **Step 3: Create the setup file (jest-dom matchers)**

Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add test scripts**

In `package.json` `scripts`, add:

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 5: Write a temporary smoke test to verify rolldown-vite + Vitest work together**

Create `src/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('the test harness', () => {
  it('runs a trivial assertion', () => {
    // given / when / then
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the smoke test — this is the rolldown-vite compatibility gate**

Run: `npm test`
Expected: PASS (1 test). If it fails due to a `rolldown-vite`/Vitest peer mismatch, STOP and resolve before continuing: try a Vitest version aligned to the Vite major (`npm install -D vitest@^3`), or as a last resort pin a standard `vite` for the test config only via `mergeConfig`. Do not proceed until green.

- [ ] **Step 7: Delete the smoke test and commit the harness**

```bash
rm src/smoke.test.ts
git add package.json package-lock.json vitest.config.ts vitest.setup.ts
git commit -m "test: add site Vitest harness (jsdom + RTL)"
```

---

## Task 2: Site pure-logic behaviors — `events.ts`

**Files:**

- Test: `src/data/events.test.ts`

Reference (current signatures, `src/data/events.ts`): `eventDateParts(date: string)` → `{ month, day, weekday, rowDay }`; `selectNext(events)`, `selectUpcoming(events)`, `selectPast(events)`; `isPast` compares `new Date(\`${date}T23:59:59\`)`to`new Date()` — so tests MUST freeze the clock.

- [ ] **Step 1: Write the behavior tests**

Create `src/data/events.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { selectNext, selectUpcoming, selectPast, eventDateParts } from '@data/events.ts';
import { type Event } from '@lib/types.ts';

function ev(id: string, date: string): Event {
  return { id, date, title: id, location: 'Lebanon, NH', time: '6:30 PM' };
}

// Freeze "now" so past/upcoming is deterministic regardless of run date.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-07-01T12:00:00'));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('selecting the next event', () => {
  describe('given a mix of past and future events', () => {
    it('returns the soonest future event', () => {
      // given
      const events = [
        ev('past', '2025-05-10'),
        ev('soon', '2025-07-16'),
        ev('later', '2025-09-01'),
      ];
      // when
      const next = selectNext(events);
      // then
      expect(next?.id).toBe('soon');
    });
  });
  describe('given only past events', () => {
    it('returns undefined', () => {
      expect(selectNext([ev('a', '2025-01-01')])).toBeUndefined();
    });
  });
});

describe('selecting upcoming events', () => {
  it('given future events, excludes the next one', () => {
    // given
    const events = [ev('soon', '2025-07-16'), ev('later', '2025-09-01')];
    // when
    const upcoming = selectUpcoming(events);
    // then
    expect(upcoming.map((e) => e.id)).toEqual(['later']);
  });
});

describe('selecting past events', () => {
  it('given past and future events, returns only past, most-recent first', () => {
    // given
    const events = [
      ev('older', '2025-05-01'),
      ev('newer', '2025-06-18'),
      ev('future', '2025-08-01'),
    ];
    // when
    const past = selectPast(events);
    // then
    expect(past.map((e) => e.id)).toEqual(['newer', 'older']);
  });
});

describe('deriving display date parts', () => {
  it('given an ISO date, returns month/day/weekday/rowDay', () => {
    // given / when
    const parts = eventDateParts('2025-07-16');
    // then
    expect(parts).toEqual({ month: 'Jul', day: '16', weekday: 'Wed', rowDay: 'Wed, Jul 16' });
  });
  it('given a first-of-month date, does not drift across the day boundary', () => {
    // noon-local construction must keep the calendar day stable
    expect(eventDateParts('2025-08-01').day).toBe('1');
  });
});
```

- [ ] **Step 2: Run and verify PASS (characterizes current behavior)**

Run: `npx vitest run src/data/events.test.ts`
Expected: PASS (all). If `eventDateParts` assertions fail, the locale string differs on this machine — adjust the expected strings to the actual output and keep the structural assertions.

- [ ] **Step 3: Commit**

```bash
git add src/data/events.test.ts
git commit -m "test: characterize event selectors and date parts"
```

---

## Task 3: Site pure-logic behaviors — `api.ts` validation

**Files:**

- Test: `src/lib/api.test.ts`

Reference (`src/lib/api.ts`): `fetchEvents()` reads `import.meta.env.VITE_EVENTS_API_URL`, calls global `fetch(\`${base}/events\`)`, throws on non-OK, parses JSON, and throws `'Events response did not match the expected shape.'`if the payload fails its type guards. The guards are internal, so we test through`fetchEvents`.

- [ ] **Step 1: Write the behavior tests**

Create `src/lib/api.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchEvents } from '@lib/api.ts';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  } as Response;
}

const goodEvent = {
  id: 'jul-2025',
  date: '2025-07-16',
  title: 'Lightning Talks',
  location: 'Lebanon, NH',
  time: '6:30 PM',
  meta: ['Doors 6:30'],
  agenda: [{ time: '7:05', description: '— a talk' }],
};

beforeEach(() => {
  vi.stubEnv('VITE_EVENTS_API_URL', 'https://api.test');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('fetching events', () => {
  describe('given a well-formed payload', () => {
    it('resolves to the events array', async () => {
      // given
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(jsonResponse({ events: [goodEvent] }))),
      );
      // when
      const events = await fetchEvents();
      // then
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('jul-2025');
    });
  });

  describe('given a non-OK HTTP response', () => {
    it('throws', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(jsonResponse(null, false, 500))),
      );
      await expect(fetchEvents()).rejects.toThrow();
    });
  });

  describe('given a malformed payload', () => {
    it('throws when an event is missing required fields', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(jsonResponse({ events: [{ id: 'x' }] }))),
      );
      await expect(fetchEvents()).rejects.toThrow('did not match the expected shape');
    });
    it('throws when an agenda item has the wrong type', async () => {
      const bad = { ...goodEvent, agenda: [{ time: 7, description: 'no' }] };
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(jsonResponse({ events: [bad] }))),
      );
      await expect(fetchEvents()).rejects.toThrow('did not match the expected shape');
    });
    it('throws when the top-level events key is absent', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(jsonResponse({ items: [] }))),
      );
      await expect(fetchEvents()).rejects.toThrow('did not match the expected shape');
    });
  });
});
```

- [ ] **Step 2: Run and verify PASS**

Run: `npx vitest run src/lib/api.test.ts`
Expected: PASS (all).

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.test.ts
git commit -m "test: characterize fetchEvents payload validation"
```

---

## Task 4: Site hook behavior — `useEvents`

**Files:**

- Test: `src/lib/useEvents.test.ts`

Reference (`src/lib/useEvents.ts`): `useEvents()` → `{ events, status }`; starts `status: 'loading'`, calls `fetchEvents()` from `@lib/api.ts`, → `success` with events or `error`; ignores result after unmount.

- [ ] **Step 1: Write the behavior tests**

Create `src/lib/useEvents.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEvents } from '@lib/useEvents.ts';
import { fetchEvents } from '@lib/api.ts';
import { type Event } from '@lib/types.ts';

vi.mock('@lib/api.ts', () => ({ fetchEvents: vi.fn() }));
const mockFetch = vi.mocked(fetchEvents);

const sample: Event[] = [
  { id: 'a', date: '2025-07-16', title: 'T', location: 'L', time: '6:30 PM' },
];

beforeEach(() => {
  mockFetch.mockReset();
});

describe('useEvents', () => {
  describe('given the fetch resolves', () => {
    it('ends in success with the events', async () => {
      // given
      mockFetch.mockResolvedValue(sample);
      // when
      const { result } = renderHook(() => useEvents());
      // then
      expect(result.current.status).toBe('loading');
      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });
      expect(result.current.events).toEqual(sample);
    });
  });

  describe('given the fetch rejects', () => {
    it('ends in error with no events', async () => {
      // given
      mockFetch.mockRejectedValue(new Error('boom'));
      // when
      const { result } = renderHook(() => useEvents());
      // then
      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
      expect(result.current.events).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Run and verify PASS**

Run: `npx vitest run src/lib/useEvents.test.ts`
Expected: PASS. (A rejecting promise logs `console.error` from the hook — that is expected, not a failure.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/useEvents.test.ts
git commit -m "test: characterize useEvents lifecycle"
```

---

## Task 5: Site component behavior — `EventCard` variants

**Files:**

- Test: `src/components/events/EventCard.test.tsx`

Reference (`src/components/events/EventCard.tsx`): variants `compact` | `featured` | `row`. Compact renders month/day/weekday + title + `time · location` + an RSVP Button. Featured renders an optional `kicker`, big `day`+`month`, `title`, `location`, `meta` lines, RSVP + "Add to calendar". Row renders `day`, `title`, `location`, `time`.

- [ ] **Step 1: Write the behavior tests**

Create `src/components/events/EventCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventCard } from '@components/events/EventCard.tsx';

describe('EventCard', () => {
  describe('compact variant', () => {
    it('renders the date parts, title, and an RSVP action', () => {
      // given / when
      render(
        <EventCard
          variant="compact"
          month="Jul"
          day="16"
          weekday="Thu"
          title="Lightning Talks & Pizza"
          time="6:30 PM"
          location="Lebanon, NH"
          rsvpLabel="RSVP"
        />,
      );
      // then
      expect(screen.getByText('Lightning Talks & Pizza')).toBeInTheDocument();
      expect(screen.getByText('16')).toBeInTheDocument();
      expect(screen.getByText(/6:30 PM/)).toBeInTheDocument();
      expect(screen.getByText('RSVP')).toBeInTheDocument();
    });
  });

  describe('featured variant', () => {
    it('renders the kicker, title, location, and meta lines', () => {
      render(
        <EventCard
          variant="featured"
          kicker="Next meetup · Thu Jul 16"
          month="Jul"
          day="16"
          title="Lightning Talks & Pizza"
          location="CCBA, Lebanon NH"
          meta={['Doors 6:30 · Talks 7:00']}
        />,
      );
      expect(screen.getByText('Next meetup · Thu Jul 16')).toBeInTheDocument();
      expect(screen.getByText('Lightning Talks & Pizza')).toBeInTheDocument();
      expect(screen.getByText('CCBA, Lebanon NH')).toBeInTheDocument();
      expect(screen.getByText('Doors 6:30 · Talks 7:00')).toBeInTheDocument();
    });
  });

  describe('row variant', () => {
    it('renders day, title, location, and time', () => {
      render(
        <EventCard
          variant="row"
          href="#/events"
          day="Thu Aug 20"
          title="Topic TBD"
          location="Lebanon, NH"
          time="6:30 PM"
        />,
      );
      expect(screen.getByText('Thu Aug 20')).toBeInTheDocument();
      expect(screen.getByText('Topic TBD')).toBeInTheDocument();
      expect(screen.getByText('Lebanon, NH')).toBeInTheDocument();
      expect(screen.getByText('6:30 PM')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run and verify PASS**

Run: `npx vitest run src/components/events/EventCard.test.tsx`
Expected: PASS. If the compact `time · location` is rendered as one text node, the `getByText(/6:30 PM/)` regex still matches; keep regex matchers for combined nodes.

- [ ] **Step 3: Commit**

```bash
git add src/components/events/EventCard.test.tsx
git commit -m "test: characterize EventCard variants"
```

---

## Task 6: Site screen behavior — `HomeScreen` states

**Files:**

- Test: `src/screens/HomeScreen.test.tsx`

Reference (`src/screens/HomeScreen.tsx`): calls `useEvents()`. `status === 'loading'` → `<Kicker>Loading events…</Kicker>`. `status === 'error'` → `<p>Couldn't load events — try again shortly.</p>`. On data → "Next meetup" section with the soonest event. It also renders `SubscribeSection` which uses `useHCaptchaSubscribe` (has DOM/captcha side effects) — mock both hooks.

- [ ] **Step 1: Write the behavior tests**

Create `src/screens/HomeScreen.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeScreen } from '@screens/HomeScreen.tsx';
import { useEvents } from '@lib/useEvents.ts';
import { type Event } from '@lib/types.ts';

vi.mock('@lib/useEvents.ts', () => ({ useEvents: vi.fn() }));
// Stub the captcha hook so SubscribeSection has no DOM/network side effects.
vi.mock('@lib/useHCaptchaSubscribe.ts', () => ({
  useHCaptchaSubscribe: () => ({
    status: 'idle',
    captchaRef: { current: null },
    handleSubmit: vi.fn(),
  }),
}));
const mockUseEvents = vi.mocked(useEvents);

const future: Event = {
  id: 'jul-2025',
  date: '2999-07-16',
  title: 'Lightning Talks & Pizza',
  location: 'Lebanon, NH',
  time: '6:30 PM',
};

beforeEach(() => {
  mockUseEvents.mockReset();
});

describe('HomeScreen', () => {
  it('given loading, shows the loading affordance', () => {
    mockUseEvents.mockReturnValue({ events: [], status: 'loading' });
    render(<HomeScreen />);
    expect(screen.getByText('Loading events…')).toBeInTheDocument();
  });

  it('given an error, shows the error line', () => {
    mockUseEvents.mockReturnValue({ events: [], status: 'error' });
    render(<HomeScreen />);
    expect(screen.getByText(/Couldn't load events/)).toBeInTheDocument();
  });

  it('given events, shows the next meetup', () => {
    mockUseEvents.mockReturnValue({ events: [future], status: 'success' });
    render(<HomeScreen />);
    expect(screen.getByText('Next meetup')).toBeInTheDocument();
    expect(screen.getByText('Lightning Talks & Pizza')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run and verify PASS**

Run: `npx vitest run src/screens/HomeScreen.test.tsx`
Expected: PASS. (The future date `2999` guarantees the event is "next" regardless of run date, so no fake timers are needed here.)

- [ ] **Step 3: Run the full site suite + lint + typecheck**

Run: `npm test && npm run lint && npx tsc --noEmit`
Expected: all green. If lint flags test-only patterns, that is fixed in the next step.

- [ ] **Step 4: Relax a few lint rules for test files**

In `eslint.config.js`, add a config block AFTER the existing `src/**` block:

```js
  {
    files: ['**/*.test.{ts,tsx}', 'vitest.setup.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
```

- [ ] **Step 5: Re-run lint and commit**

Run: `npm run lint`
Expected: clean.

```bash
git add src/screens/HomeScreen.test.tsx eslint.config.js
git commit -m "test: characterize HomeScreen loading/error/success states"
```

---

## Task 7: Service test harness (Workers pool + D1)

**Files:**

- Modify: `events-service/package.json`, `events-service/tsconfig.json`
- Create: `events-service/vitest.config.ts`, `events-service/test/env.d.ts`, `events-service/test/helpers.ts`, `events-service/src/smoke.test.ts` (temporary)

- [ ] **Step 1: Install service test deps**

Run:

```bash
cd /Users/connor/upper-valley-tech/events-service
npm install -D vitest @cloudflare/vitest-pool-workers
```

- [ ] **Step 2: Create the Workers-pool Vitest config**

Create `events-service/vitest.config.ts`:

```ts
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

// Runs tests inside the Workers runtime with the bindings from wrangler.jsonc
// (D1 "DB", KV "OAUTH_KV"). D1 is a local simulated database — the placeholder
// database_id in wrangler.jsonc is fine; nothing touches real Cloudflare.
export default defineWorkersConfig({
  test: {
    include: ['src/**/*.test.ts'],
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
  },
});
```

- [ ] **Step 3: Type the `cloudflare:test` env**

Create `events-service/test/env.d.ts`:

```ts
/// <reference types="@cloudflare/vitest-pool-workers" />
import { type Env } from '../src/types.ts';

declare module 'cloudflare:test' {
  // The bindings available as `env` in tests mirror the Worker's Env.
  interface ProvidedEnv extends Env {}
}
```

- [ ] **Step 4: Include the test dir in tsconfig**

In `events-service/tsconfig.json`, change `"include": ["src"]` to:

```json
  "include": ["src", "test"]
```

- [ ] **Step 5: Create DB helpers (schema reset + seed)**

Create `events-service/test/helpers.ts`:

```ts
import { type Env } from '../src/types.ts';

// The schema, imported as a raw string (Vite ?raw). Split on ';' and run each
// statement so we don't depend on D1.exec multi-statement quirks.
import schema from '../migrations/0001_init.sql?raw';

export async function resetDb(env: Env): Promise<void> {
  await env.DB.exec('DROP TABLE IF EXISTS events');
  await env.DB.exec('DROP TABLE IF EXISTS organizers');
  for (const stmt of schema
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)) {
    await env.DB.prepare(stmt).run();
  }
}

export async function seedOrganizer(env: Env, email: string): Promise<void> {
  await env.DB.prepare('INSERT OR REPLACE INTO organizers (email, added_by) VALUES (?, ?)')
    .bind(email.toLowerCase(), 'test')
    .run();
}

interface SeedEvent {
  id: string;
  date: string;
  title?: string;
  location?: string;
  time?: string;
  meta?: string[];
  agenda?: unknown[];
  attendees?: string;
  status?: string;
}
export async function seedEvent(env: Env, e: SeedEvent): Promise<void> {
  await env.DB.prepare(
    `INSERT OR REPLACE INTO events (id, date, title, location, time, rsvp_href, meta, agenda, attendees, status)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
  )
    .bind(
      e.id,
      e.date,
      e.title ?? e.id,
      e.location ?? 'Lebanon, NH',
      e.time ?? '6:30 PM',
      e.meta ? JSON.stringify(e.meta) : null,
      e.agenda ? JSON.stringify(e.agenda) : null,
      e.attendees ?? null,
      e.status ?? 'scheduled',
    )
    .run();
}
```

- [ ] **Step 6: Smoke test the pool + D1**

Create `events-service/src/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { resetDb, seedEvent } from '../test/helpers.ts';
import { listPublishedEvents } from './db.ts';

describe('the worker test harness', () => {
  it('seeds and reads from a local D1', async () => {
    // given
    await resetDb(env);
    await seedEvent(env, { id: 'a', date: '2025-07-16' });
    // when
    const events = await listPublishedEvents(env);
    // then
    expect(events.map((e) => e.id)).toEqual(['a']);
  });
});
```

- [ ] **Step 7: Add test scripts and run the smoke test**

In `events-service/package.json` `scripts`, add:

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

Run: `npm test`
Expected: PASS. If `?raw` import fails under the pool, replace the import in `helpers.ts` with an inline schema constant (paste the DDL from `migrations/0001_init.sql`). If `defineWorkersConfig`/`configPath` errors, consult current `@cloudflare/vitest-pool-workers` docs for the exact option name before proceeding.

- [ ] **Step 8: Delete the smoke test and commit**

```bash
rm src/smoke.test.ts
git add package.json package-lock.json vitest.config.ts tsconfig.json test/
git commit -m "test: add events-service Workers-pool harness"
```

---

## Task 8: Extract injectable tool operations (the testable auth seam)

**Why:** The MCP tools read the caller's email from `getMcpAuthContext()` inside `createServer` (`src/mcp.ts`), which can't be driven without the OAuth flow. Move the gate + DB work into plain functions that take the email explicitly, so tests inject "an organizer" / "a stranger" directly. Behavior is preserved; `mcp.ts` becomes thin wiring.

**Files:**

- Create: `events-service/src/operations.ts`
- Modify: `events-service/src/mcp.ts`

- [ ] **Step 1: Create `operations.ts`**

Create `events-service/src/operations.ts`:

```ts
import { type Env } from './types.ts';
import {
  addEvent,
  addOrganizer,
  cancelEvent,
  eventExists,
  isOrganizer,
  listAllEvents,
  updateEvent,
  type NewEvent,
  type EventPatch,
} from './db.ts';

export type OpResult = { ok: true; message: string } | { ok: false; error: string };

export interface AddEventInput {
  id?: string;
  date: string;
  title: string;
  location: string;
  time: string;
  rsvpHref?: string;
  meta?: string[];
  agenda?: NewEvent['agenda'];
  attendees?: string;
}
export type UpdateEventInput = { id: string } & EventPatch;

/** Derive a slug like "jul-2025" from a YYYY-MM-DD date. */
export function slugFromDate(date: string): string {
  const months = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];
  const [year, month] = date.split('-');
  return `${months[Number(month) - 1] ?? month}-${year}`;
}

// Returns an error string if the email is missing or not an organizer, else null.
async function denyIfNotOrganizer(env: Env, email: string | null): Promise<string | null> {
  if (!email) return 'Not authenticated.';
  if (!(await isOrganizer(env, email))) return `Access denied: ${email} is not an organizer.`;
  return null;
}

export async function listEventsOp(env: Env, email: string | null) {
  const denied = await denyIfNotOrganizer(env, email);
  if (denied) return { ok: false as const, error: denied };
  return { ok: true as const, events: await listAllEvents(env) };
}

export async function addEventOp(
  env: Env,
  email: string | null,
  input: AddEventInput,
): Promise<OpResult> {
  const denied = await denyIfNotOrganizer(env, email);
  if (denied) return { ok: false, error: denied };
  const id = input.id ?? slugFromDate(input.date);
  if (await eventExists(env, id))
    return {
      ok: false,
      error: `An event with id "${id}" already exists. Use update_event instead.`,
    };
  const newEvent: NewEvent = {
    id,
    date: input.date,
    title: input.title,
    location: input.location,
    time: input.time,
    rsvpHref: input.rsvpHref,
    meta: input.meta,
    agenda: input.agenda,
    attendees: input.attendees,
  };
  await addEvent(env, newEvent);
  return { ok: true, message: `Created event "${id}".` };
}

export async function updateEventOp(
  env: Env,
  email: string | null,
  input: UpdateEventInput,
): Promise<OpResult> {
  const denied = await denyIfNotOrganizer(env, email);
  if (denied) return { ok: false, error: denied };
  const { id, ...patch } = input;
  const updated = await updateEvent(env, id, patch);
  if (!updated) return { ok: false, error: `No event with id "${id}".` };
  return { ok: true, message: `Updated event "${id}".` };
}

export async function cancelEventOp(env: Env, email: string | null, id: string): Promise<OpResult> {
  const denied = await denyIfNotOrganizer(env, email);
  if (denied) return { ok: false, error: denied };
  const cancelled = await cancelEvent(env, id);
  if (!cancelled) return { ok: false, error: `No event with id "${id}".` };
  return { ok: true, message: `Cancelled event "${id}".` };
}

export async function addOrganizerOp(
  env: Env,
  email: string | null,
  newEmail: string,
): Promise<OpResult> {
  const denied = await denyIfNotOrganizer(env, email);
  if (denied) return { ok: false, error: denied };
  await addOrganizer(env, newEmail, email);
  return { ok: true, message: `Added organizer "${newEmail.toLowerCase()}".` };
}
```

- [ ] **Step 2: Rewire `mcp.ts` to delegate to operations**

In `events-service/src/mcp.ts`: remove the `asOrganizer` helper, the `slugFromDate` function, and the direct `db.ts` write imports. Keep `callerEmail()`, `ok()`, `fail()`, `purgeEventsCache`. Replace the five `server.tool(...)` bodies so each calls the matching op and maps the result. Example for the five tools (keep the existing Zod input schemas unchanged):

```ts
import {
  addEventOp,
  addOrganizerOp,
  cancelEventOp,
  listEventsOp,
  updateEventOp,
} from './operations.ts';

// list_events
async () => {
  const r = await listEventsOp(env, callerEmail());
  return r.ok ? ok(JSON.stringify(r.events, null, 2)) : fail(r.error);
};

// add_event  (input is the validated Zod object)
async (input) => {
  const r = await addEventOp(env, callerEmail(), input);
  if (r.ok) await purgeEventsCache(requestUrl);
  return r.ok ? ok(r.message) : fail(r.error);
};

// update_event
async (input) => {
  const r = await updateEventOp(env, callerEmail(), input);
  if (r.ok) await purgeEventsCache(requestUrl);
  return r.ok ? ok(r.message) : fail(r.error);
};

// cancel_event
async ({ id }) => {
  const r = await cancelEventOp(env, callerEmail(), id);
  if (r.ok) await purgeEventsCache(requestUrl);
  return r.ok ? ok(r.message) : fail(r.error);
};

// add_organizer
async ({ email }) => {
  const r = await addOrganizerOp(env, callerEmail(), email);
  return r.ok ? ok(r.message) : fail(r.error);
};
```

- [ ] **Step 3: Verify the service still typechecks and boots**

Run:

```bash
npm run typecheck
npx wrangler dev --local --port 8799 & sleep 12; curl -s -o /dev/null -w "%{http_code}" http://localhost:8799/events; curl -s -o /dev/null -w "%{http_code}" http://localhost:8799/mcp; kill %1
```

Expected: typecheck clean; `/events` → 200; `/mcp` → 401.

- [ ] **Step 4: Commit the refactor**

```bash
git add src/operations.ts src/mcp.ts
git commit -m "refactor: extract injectable tool operations from mcp wiring"
```

---

## Task 9: Service behavior — `GET /events`

**Files:**

- Test: `events-service/src/events-endpoint.test.ts`

The endpoint is served by the default export in `src/index.ts`. Drive it with the pool's `SELF` fetcher.

- [ ] **Step 1: Write the behavior tests**

Create `events-service/src/events-endpoint.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { resetDb, seedEvent } from '../test/helpers.ts';

beforeEach(async () => {
  await resetDb(env);
});

describe('GET /events', () => {
  it('given scheduled and cancelled events, returns only scheduled ones', async () => {
    // given
    await seedEvent(env, { id: 'live', date: '2025-07-16' });
    await seedEvent(env, { id: 'dead', date: '2025-08-16', status: 'cancelled' });
    // when
    const res = await SELF.fetch('https://example.com/events');
    const body = await res.json<{ events: { id: string }[] }>();
    // then
    expect(res.status).toBe(200);
    expect(body.events.map((e) => e.id)).toEqual(['live']);
  });

  it('sets a cache-control header', async () => {
    const res = await SELF.fetch('https://example.com/events');
    expect(res.headers.get('Cache-Control')).toMatch(/s-maxage/);
  });

  it('parses meta and agenda JSON columns into arrays', async () => {
    // given
    await seedEvent(env, {
      id: 'jul',
      date: '2025-07-16',
      meta: ['Doors 6:30'],
      agenda: [{ time: '7:05', description: '— a talk' }],
    });
    // when
    const res = await SELF.fetch('https://example.com/events');
    const body = await res.json<{ events: { meta: string[]; agenda: { time: string }[] }[] }>();
    // then
    expect(body.events[0].meta).toEqual(['Doors 6:30']);
    expect(body.events[0].agenda[0].time).toBe('7:05');
  });
});
```

- [ ] **Step 2: Run and verify PASS**

Run: `npx vitest run src/events-endpoint.test.ts`
Expected: PASS. (The cache header test reads the freshly-built response; if a cached response from a prior test interferes, the `resetDb` beforeEach keeps data isolated — the cache key is the `/events` URL and content is regenerated per test run.)

- [ ] **Step 3: Commit**

```bash
git add src/events-endpoint.test.ts
git commit -m "test: characterize GET /events behavior"
```

---

## Task 10: Service behavior — authorization gate + validation

**Files:**

- Test: `events-service/src/operations.test.ts`

- [ ] **Step 1: Write the behavior tests**

Create `events-service/src/operations.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { resetDb, seedOrganizer, seedEvent } from '../test/helpers.ts';
import {
  addEventOp,
  updateEventOp,
  cancelEventOp,
  addOrganizerOp,
  listEventsOp,
} from './operations.ts';
import { isOrganizer, listAllEvents } from './db.ts';

const ORGANIZER = 'organizer@example.com';
const STRANGER = 'stranger@example.com';
const validEvent = {
  date: '2025-07-16',
  title: 'Lightning Talks',
  location: 'Lebanon, NH',
  time: '6:30 PM',
};

beforeEach(async () => {
  await resetDb(env);
  await seedOrganizer(env, ORGANIZER);
});

describe('the authorization gate', () => {
  describe('given a non-organizer', () => {
    it('rejects add_event and writes nothing', async () => {
      // when
      const r = await addEventOp(env, STRANGER, { ...validEvent, id: 'x' });
      // then
      expect(r.ok).toBe(false);
      expect(await listAllEvents(env)).toHaveLength(0);
    });
    it('rejects an unauthenticated caller (null email)', async () => {
      const r = await addEventOp(env, null, { ...validEvent, id: 'x' });
      expect(r).toEqual({ ok: false, error: 'Not authenticated.' });
    });
  });

  describe('given an organizer', () => {
    it('creates an event (slug derived from date when id omitted)', async () => {
      // when
      const r = await addEventOp(env, ORGANIZER, validEvent);
      // then
      expect(r.ok).toBe(true);
      const all = await listAllEvents(env);
      expect(all.map((e) => e.id)).toEqual(['jul-2025']);
    });
    it('rejects a duplicate id', async () => {
      await addEventOp(env, ORGANIZER, { ...validEvent, id: 'dup' });
      const r = await addEventOp(env, ORGANIZER, { ...validEvent, id: 'dup' });
      expect(r.ok).toBe(false);
    });
    it('updates only the provided fields', async () => {
      await seedEvent(env, { id: 'e1', date: '2025-07-16', title: 'Old' });
      const r = await updateEventOp(env, ORGANIZER, { id: 'e1', title: 'New' });
      expect(r.ok).toBe(true);
      const all = await listAllEvents(env);
      expect(all.find((e) => e.id === 'e1')?.title).toBe('New');
    });
    it('cancels an event (and GET /events would then exclude it)', async () => {
      await seedEvent(env, { id: 'e1', date: '2025-07-16' });
      const r = await cancelEventOp(env, ORGANIZER, 'e1');
      expect(r.ok).toBe(true);
      const all = await listAllEvents(env);
      expect(all.find((e) => e.id === 'e1')?.status).toBe('cancelled');
    });
    it('adds another organizer', async () => {
      const r = await addOrganizerOp(env, ORGANIZER, 'NewPerson@Example.com');
      expect(r.ok).toBe(true);
      expect(await isOrganizer(env, 'newperson@example.com')).toBe(true);
    });
  });

  describe('list_events', () => {
    it('is allowed for an organizer and denied for a stranger', async () => {
      await seedEvent(env, { id: 'e1', date: '2025-07-16' });
      expect((await listEventsOp(env, ORGANIZER)).ok).toBe(true);
      expect((await listEventsOp(env, STRANGER)).ok).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run and verify PASS**

Run: `npx vitest run src/operations.test.ts`
Expected: PASS (all).

- [ ] **Step 3: Commit**

```bash
git add src/operations.test.ts
git commit -m "test: characterize organizer authorization gate"
```

---

## Task 11: Service behavior — DB mapping + patch building

**Files:**

- Test: `events-service/src/db.test.ts`

Reference (`src/db.ts`): `listPublishedEvents` maps rows to `EventRecord` (meta/agenda JSON parsed, nulls → undefined); `updateEvent(env, id, patch)` sets only provided columns and returns `false` for an unknown id.

- [ ] **Step 1: Write the behavior tests**

Create `events-service/src/db.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { resetDb, seedEvent } from '../test/helpers.ts';
import { listPublishedEvents, updateEvent } from './db.ts';

beforeEach(async () => {
  await resetDb(env);
});

describe('row mapping', () => {
  it('given a row with null meta/agenda, omits them on the record', async () => {
    await seedEvent(env, { id: 'plain', date: '2025-07-16' });
    const [rec] = await listPublishedEvents(env);
    expect(rec.meta).toBeUndefined();
    expect(rec.agenda).toBeUndefined();
    expect(rec.rsvpHref).toBeUndefined();
  });
  it('given JSON columns, parses them into arrays', async () => {
    await seedEvent(env, {
      id: 'rich',
      date: '2025-07-16',
      meta: ['a', 'b'],
      agenda: [{ time: '7:05', description: 'x' }],
    });
    const [rec] = await listPublishedEvents(env);
    expect(rec.meta).toEqual(['a', 'b']);
    expect(rec.agenda).toEqual([{ time: '7:05', description: 'x' }]);
  });
});

describe('updateEvent patch building', () => {
  it('given an unknown id, returns false', async () => {
    expect(await updateEvent(env, 'nope', { title: 'x' })).toBe(false);
  });
  it('leaves unspecified fields untouched', async () => {
    await seedEvent(env, { id: 'e1', date: '2025-07-16', title: 'Keep', location: 'Hanover, NH' });
    await updateEvent(env, 'e1', { title: 'Changed' });
    const [rec] = await listPublishedEvents(env);
    expect(rec.title).toBe('Changed');
    expect(rec.location).toBe('Hanover, NH');
  });
});
```

- [ ] **Step 2: Run and verify PASS**

Run: `npx vitest run src/db.test.ts`
Expected: PASS.

- [ ] **Step 3: Run the full service suite and commit**

Run: `npm test`
Expected: all service tests green.

```bash
git add src/db.test.ts
git commit -m "test: characterize DB row mapping and patch building"
```

---

## Task 12: Aggregate runner + prove the net has teeth

**Files:**

- Modify: `package.json` (root)

- [ ] **Step 1: Add the aggregate test script**

In the ROOT `package.json` `scripts`, add:

```json
    "test:all": "npm test && npm test --prefix events-service",
```

- [ ] **Step 2: Run everything**

Run: `cd /Users/connor/upper-valley-tech && npm run test:all`
Expected: both suites green.

- [ ] **Step 3: Prove a regression turns a test red (teeth check)**

Temporarily break a behavior, confirm red, then revert:

```bash
# Break selectNext: make it return undefined
#   edit src/data/events.ts -> selectNext returns `undefined`
npx vitest run src/data/events.test.ts   # EXPECT: FAIL
git checkout src/data/events.ts          # revert

# Break the auth gate: make denyIfNotOrganizer always return null
#   edit events-service/src/operations.ts
cd events-service && npx vitest run src/operations.test.ts   # EXPECT: FAIL
git checkout src/operations.ts; cd ..    # revert
```

Expected: each deliberately-broken run FAILS, proving the tests have teeth. Both files reverted.

- [ ] **Step 4: Final green run + commit**

Run: `npm run test:all`
Expected: all green.

```bash
git add package.json
git commit -m "test: add aggregate test:all runner"
```

---

## Self-Review

- **Spec coverage:** Layer 1 site (Tasks 2–3) ✓; Layer 2 site components/hooks (Tasks 4–6) ✓; Layer 3 service endpoint/gate/validation (Tasks 9–10) + DB mapping (Task 11) ✓; OAuth boundary handled via injectable ops (Task 8) ✓; per-package runners + `test:all` (Tasks 1, 7, 12) ✓; fixed-clock determinism (Task 2) ✓; teeth check for the "regression turns red" success criterion (Task 12) ✓.
- **Known verification points (called out inline, not placeholders):** rolldown-vite ↔ Vitest compat (Task 1 Step 6); `?raw` import + `defineWorkersConfig` option names under the current pool version (Task 7 Step 7). Each has a concrete fallback.
- **Type consistency:** `OpResult` shape and the `*Op(env, email, …)` signatures in Task 8 match their usages in Tasks 8 (mcp wiring) and 10 (tests); helper names `resetDb`/`seedEvent`/`seedOrganizer` are consistent across Tasks 7, 9, 10, 11.
