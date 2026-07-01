# BDD Regression-Net Design

**Date:** 2026-06-23
**Status:** Approved (design), pending implementation plan
**Topic:** Behavior-driven test coverage for the Upper Valley Tech site + events service

## Context

The repository has grown from a placeholder page into two cooperating projects:

- **The website** (`/`) — a Vite + React 19 + TypeScript single-page site (Home, Events, About, Code of Conduct) that fetches event data at runtime from an HTTP API.
- **The events service** (`events-service/`) — a Cloudflare Worker exposing a public `GET /events` read API and an OAuth-protected MCP endpoint (`add_event`, `update_event`, `cancel_event`, `list_events`, `add_organizer`) backed by D1.

To date the work has been verified only by type-checking, linting, builds, and manual smoke tests. There is **no automated test suite** — no test runner, no test files, no `test` script in either package. As the logic accrues (date-driven event selection, defensive API validation, an organizer authorization gate), the risk of silent regressions grows.

This design establishes a **behavior-driven regression net**: tests that pin down what the system _already does_, written as observable behaviors, as a safety net against future regressions. The goal is coverage of existing behavior — not driving new development test-first (that may follow later, but is out of scope here).

## Goals

- Lock down the current, correct behavior of both projects so regressions surface immediately.
- Express tests as behaviors (Given/When/Then), readable as a description of how the system acts.
- Keep each package's test tooling self-contained, matching the existing two-package structure.

## Non-Goals

- Driving new feature development test-first (this is a retroactive safety net).
- Testing the real Google OAuth authentication round-trip (third-party; verified manually at deploy).
- Full browser end-to-end testing (Playwright). Component-level rendering behavior is covered without a real browser.

## Approach

**BDD style:** behaviors expressed in Vitest with nested `describe('given …')` / `it('… then …')` blocks and `// given / when / then` sections inside each test. This is "BDD as a writing discipline," not a separate Gherkin layer — no `.feature` files, no step-definition glue, full TypeScript type-safety and speed.

**Per-package test runners, one aggregate command** (mirrors the existing `dev:all` bridge between the two packages):

- **Site** (`/`): Vitest + `@testing-library/react` + `@testing-library/jest-dom` + jsdom.
- **Service** (`events-service/`): Vitest + `@cloudflare/vitest-pool-workers` (runs tests inside the Workers runtime with real bindings, including a local D1).
- Each package gets its own `test` and `test:watch` scripts. A root `test:all` runs both.

Test files are co-located with the code they cover as `*.test.ts` / `*.test.tsx`.

## What Is Tested

### Layer 1 — Pure logic (both packages)

Fast, no DOM or Worker runtime required.

- **`src/data/events.ts`**: `selectNext`, `selectUpcoming`, `selectPast` — given a mix of past/future events, the soonest future event is "next"; upcoming excludes the next; past is reverse-chronological. `eventDateParts` — correct `month`/`day`/`weekday`/`rowDay`, including day-boundary and timezone edge cases (the function uses noon-local to avoid off-by-one).
- **`src/lib/api.ts`**: the type guards (`isEvent`, `isEventsPayload`, etc.) — a well-formed payload passes; malformed payloads (missing fields, wrong types, bad agenda items) are rejected so `fetchEvents` throws rather than returning corrupt data.
- **`events-service/src/db.ts`** (pure parts): `rowToEvent` JSON parsing (meta/agenda strings → arrays, null tolerance); `updateEvent` patch-building (only provided fields are set).

### Layer 2 — Site components & hooks (jsdom + RTL)

- **`useEvents`**: given a resolving fetch, status goes loading → success with events; given a rejecting fetch, loading → error; unmount mid-flight does not set state.
- **Home & Events screens**: given loading, the loading affordance shows; given an error, the error line shows; given events, the next-meetup / upcoming / past sections render. (`fetchEvents` is mocked at the module boundary.)
- **`EventCard`**: each variant (compact / featured / row) renders the expected fields (date parts, title, location, time, RSVP affordance).

### Layer 3 — Service integration (Workers pool + local D1)

- **`GET /events`**: returns the published events as JSON in the site's `Event` shape; includes the cache-control header; returns only `status = 'scheduled'` events (cancelled excluded).
- **Authorization gate** (the security-critical behavior): given an organizer email in props, `add_event` / `update_event` / `cancel_event` / `add_organizer` succeed and persist to D1; given a non-organizer email, each is rejected with an MCP tool error and D1 is unchanged.
- **Input validation**: `add_event` with malformed input (bad date, missing required field) is rejected.

### The OAuth boundary

Real Google login cannot run in tests. We test the **authorization** layer (the `isOrganizer` gate and tool behavior) by **injecting the authenticated email/props directly** into the MCP tool invocation — not by faking Google. The OAuth **authentication** flow (Google `/authorize` → `/callback` → token mint) is explicitly out of scope and verified manually at deploy. Tests read as "given an organizer / given a non-organizer, when they call a tool, then …" without simulating Google.

## Data Flow / Fixtures

- A small shared set of event fixtures (a clearly-past event, a soon-upcoming event, a later-upcoming event, a cancelled event) drives the selector and endpoint tests. Because past/upcoming is computed against "now," tests either build fixtures relative to a fixed clock (`vi.setSystemTime`) or relative to the current date — fixtures use a fixed clock so results are deterministic regardless of when the suite runs.
- Service integration tests seed the local D1 (reusing `migrations/0001_init.sql`) with fixtures per test, asserting against `GET /events` and tool effects.

## Tooling / Compatibility Notes

- The site depends on `rolldown-vite` (a Vite drop-in). Vitest compatibility with `rolldown-vite` will be **verified before committing to it** during implementation; if there is friction, the fallback is pinning a compatible Vitest/Vite arrangement for the test config only.
- React 19 is supported by current React Testing Library.
- The Workers pool requires its own Vitest config in `events-service/` referencing `wrangler.jsonc` for bindings.

## Success Criteria

- `npm run test:all` runs both suites green.
- Each layer above has at least the named behaviors covered.
- A deliberately introduced regression (e.g. breaking `selectNext`, or removing the organizer check) turns a test red.
- Tests are deterministic (fixed clock) and require no network or real Google credentials.
