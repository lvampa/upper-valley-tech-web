import { useEffect, useState } from 'react';
import { type Event, type Status } from './types.ts';
import { fetchEvents } from './api.ts';

interface UseEventsResult {
  events: Event[];
  status: Status;
}

/**
 * Fetches the events list once on mount and tracks its lifecycle status.
 * StrictMode double-invokes effects; the `active` flag drops the result of a
 * stale run so we never set state after unmount.
 */
export function useEvents(): UseEventsResult {
  const [events, setEvents] = useState<Event[]>([]);
  const [status, setStatus] = useState<Status>('loading');

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
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  return { events, status };
}
