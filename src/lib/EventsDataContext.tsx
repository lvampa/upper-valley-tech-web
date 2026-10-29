import { createContext, useContext, type ReactNode } from 'react';
import { type EventsSnapshot } from './types.ts';

const EventsDataContext = createContext<EventsSnapshot | null>(null);

export function EventsDataProvider({
  value,
  children,
}: {
  value: EventsSnapshot | null;
  children: ReactNode;
}) {
  return <EventsDataContext.Provider value={value}>{children}</EventsDataContext.Provider>;
}

/** The build-time events snapshot (or null on a cold client render). */
export function useEventsSeed(): EventsSnapshot | null {
  return useContext(EventsDataContext);
}
