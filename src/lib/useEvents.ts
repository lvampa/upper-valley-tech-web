import { useEffect, useState, useSyncExternalStore } from 'react';
import { type Event, type Status } from './types.ts';
import { fetchEvents } from './api.ts';
import { useEventsSeed } from './EventsDataContext.tsx';

interface UseEventsResult {
  events: Event[];
  status: Status;
  /** The time to judge past/upcoming against. */
  now: Date;
}

const noSubscription = () => () => undefined;

/** False while rendering on the server or hydrating, true afterward. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

/**
 * Fetches the events list on mount and tracks its lifecycle status. When a
 * build-time seed is present (SSR/hydration), the first render already shows
 * it (status 'success') and uses the build time as `now`, so server and client
 * markup match; after hydration `now` is the real clock, and the mount effect
 * refreshes with live data. StrictMode double-invokes effects; the `active` flag drops
 * the result of a stale run so we never set state after unmount.
 */
export function useEvents(): UseEventsResult {
  const snapshot = useEventsSeed();
  const seed = snapshot?.events ?? null;
  const [events, setEvents] = useState<Event[]>(seed ?? []);
  const [status, setStatus] = useState<Status>(seed ? 'success' : 'loading');
  const hydrated = useHydrated();
  const now = snapshot && !hydrated ? new Date(snapshot.asOf) : new Date();

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
        // Keep a working seed on screen if the live refresh fails.
        if (!seed) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [seed]);

  return { events, status, now };
}
