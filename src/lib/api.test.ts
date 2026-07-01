import { describe, it, expect, afterEach, vi } from 'vitest';
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

// The events API base URL comes from `.env.test` (VITE_EVENTS_API_URL=https://api.test);
// t3-env validates it at module import, so it can't be stubbed per-test. The fetch
// mock below ignores the URL, so the assertions still hold.
afterEach(() => {
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

  describe('given a well-formed payload with no events', () => {
    it('resolves to an empty array', async () => {
      // given
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(jsonResponse({ events: [] }))),
      );
      // when
      const events = await fetchEvents();
      // then
      expect(events).toEqual([]);
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
