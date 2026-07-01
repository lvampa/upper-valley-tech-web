import { EventCard } from './EventCard.tsx';
import { eventDateParts } from '@data/events.ts';
import { type Event } from '@lib/types.ts';

interface EventRowProps {
  event: Event;
  href?: string;
  past?: boolean;
}

/**
 * A single event rendered as a row — derives its display date from the
 * event's ISO date so callers never hand-format weekdays. Past events show
 * attendee count in place of the time.
 */
export function EventRow({ event, href = '#/events', past = false }: EventRowProps) {
  const { rowDay } = eventDateParts(event.date);
  return (
    <EventCard
      variant="row"
      past={past}
      href={href}
      day={rowDay}
      title={event.title}
      location={event.location}
      time={past ? (event.attendees ?? event.time) : event.time}
    />
  );
}
