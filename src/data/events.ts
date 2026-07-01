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

function isPast(date: string) {
  return new Date(`${date}T23:59:59`) < new Date();
}

// Pure selectors over an events array fetched at runtime. The list itself now
// lives server-side; these just slice it for the UI.

export function selectNext(events: Event[]): Event | undefined {
  return events.find((e) => !isPast(e.date));
}

export function selectUpcoming(events: Event[]): Event[] {
  const next = selectNext(events);
  return events.filter((e) => !isPast(e.date) && e.id !== next?.id);
}

export function selectPast(events: Event[]): Event[] {
  return events.filter((e) => isPast(e.date)).reverse();
}
