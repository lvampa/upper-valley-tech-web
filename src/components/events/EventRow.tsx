import { EventCard } from './EventCard.tsx';
import { eventDateParts } from '@data/events.ts';
import { type Event } from '@lib/types.ts';

interface EventRowProps {
  event: Event;
  past?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

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
      time={event.time}
    />
  );
}
