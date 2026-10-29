import { type Event } from '@lib/types.ts';

// Derive the display strings EventCard needs from an ISO date string.
// Uses noon local time to avoid day-boundary timezone shifts.
export function eventDateParts(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    day: String(d.getDate()),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    rowDay: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  };
}

function isPast(date: string, now: Date) {
  return new Date(`${date}T23:59:59`) < now;
}

// Pure selectors over an events array fetched at runtime. The list itself now
// lives server-side; these just slice it for the UI. `now` is passed in so the
// prerendered markup and the hydrating client agree on what is past.

export function selectNext(events: Event[], now: Date): Event | undefined {
  return events.find((e) => !isPast(e.date, now));
}

export function selectUpcoming(events: Event[], now: Date): Event[] {
  const next = selectNext(events, now);
  return events.filter((e) => !isPast(e.date, now) && e.id !== next?.id);
}

export function selectPast(events: Event[], now: Date): Event[] {
  return events.filter((e) => isPast(e.date, now)).reverse();
}
