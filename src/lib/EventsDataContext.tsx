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
