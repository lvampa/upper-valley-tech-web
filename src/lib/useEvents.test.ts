import { createElement, type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useEvents } from '@lib/useEvents.ts';
import { EventsDataProvider } from '@lib/EventsDataContext.tsx';
import { fetchEvents } from '@lib/api.ts';
import { type Event, type EventsSnapshot } from '@lib/types.ts';

vi.mock('@lib/api.ts', () => ({ fetchEvents: vi.fn() }));
const mockFetch = vi.mocked(fetchEvents);

const sample: Event[] = [
  { id: 'a', date: '2025-07-16', title: 'T', location: 'L', time: '6:30 PM' },
];
const builtAt = '2025-07-01T12:00:00.000Z';
const neverSettles = () => new Promise<Event[]>(() => undefined);

function withSnapshot(snapshot: EventsSnapshot) {
  return ({ children }: { children: ReactNode }) =>
    createElement(EventsDataProvider, { value: snapshot, children });
}

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

  describe('given a build-time seed via context', () => {
    it('starts in success with the seeded events (SSR parity)', () => {
      // given
      mockFetch.mockImplementation(neverSettles);
      const wrapper = withSnapshot({ events: sample, asOf: builtAt });
      // when
      const { result } = renderHook(() => useEvents(), { wrapper });
      // then: the first render already carries the seed
      expect(result.current.events).toEqual(sample);
      expect(result.current.status).toBe('success');
    });

    it('uses the build time as now when server rendering', () => {
      // given
      let serverNow: Date | undefined;
      function Probe() {
        serverNow = useEvents().now;
        return null;
      }
      const snapshot = { events: sample, asOf: builtAt };
      // when
      renderToString(
        createElement(EventsDataProvider, { value: snapshot, children: createElement(Probe) }),
      );
      // then
      expect(serverNow?.toISOString()).toBe(builtAt);
    });

    it('uses the real clock once rendered on the client', () => {
      // given
      mockFetch.mockImplementation(neverSettles);
      const wrapper = withSnapshot({ events: sample, asOf: builtAt });
      // when
      const { result } = renderHook(() => useEvents(), { wrapper });
      // then
      expect(result.current.now.getTime()).toBeGreaterThan(Date.parse(builtAt));
    });
  });

  describe('given the build could not fetch events', () => {
    it('shows loading, then error when the live fetch also fails', async () => {
      // given
      mockFetch.mockRejectedValue(new Error('boom'));
      const wrapper = withSnapshot({ events: null, asOf: builtAt });
      // when
      const { result } = renderHook(() => useEvents(), { wrapper });
      // then
      expect(result.current.status).toBe('loading');
      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
    });
  });
});
