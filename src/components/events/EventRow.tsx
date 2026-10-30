import { EventCard } from './EventCard.tsx';
import { eventDateParts } from '@data/events.ts';
import { type Event } from '@lib/types.ts';

interface EventRowProps {
  event: Event;
  past?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

/**
 * A single event rendered as a row. Derives its display date from the event's
 * ISO date so callers never hand-format weekdays. Past events show attendee
 * count in place of the time. With onSelect, the row is a button.
 */
export function EventRow({ event, past = false, selected, onSelect }: EventRowProps) {
  const { rowDay } = eventDateParts(event.date);
  return (
    <EventCard
      variant="row"
      past={past}
      selected={selected}
      onSelect={onSelect}
      day={rowDay}
      title={event.title}
      location={event.location}
      time={past ? (event.attendees ?? event.time) : event.time}
    />
  );
}
