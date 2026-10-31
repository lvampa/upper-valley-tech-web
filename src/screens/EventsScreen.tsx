import { useEffect, useRef, useState } from 'react';
import { EventCard } from '@components/events/EventCard.tsx';
import { EventRow } from '@components/events/EventRow.tsx';
import { EventsStatus } from '@components/events/EventsStatus.tsx';
import { Kicker } from '@components/core/Kicker.tsx';
import { Button } from '@components/core/Button.tsx';
import { PageHeading, Period } from '@components/core/PageHeading.tsx';
import { selectNext, selectUpcoming, selectPast, eventDateParts } from '@data/events.ts';
import { useEvents } from '@lib/useEvents.ts';
import { type AgendaItem, type Event } from '@lib/types.ts';

function Agenda({ items }: { items: AgendaItem[] }) {
  return (
    <div
      style={{
        paddingTop: 16,
        borderTop: '1px solid var(--line)',
        margin: '4px 0 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
      }}
    >
      {items.map((r, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '46px 1fr',
            gap: 12,
            fontSize: 13,
            alignItems: 'baseline',
          }}
        >
          <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {r.time}
          </span>
          <span style={{ color: r.open ? 'var(--ink-3)' : 'var(--ink-2)' }}>
            {r.speaker ? (
              <>
                <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{r.speaker}</b>
                {' - '}
              </>
            ) : null}
            {r.description}
          </span>
        </div>
      ))}
    </div>
  );
}

type FeaturedKind = 'next' | 'upcoming' | 'past';

function FeaturedEvent({
  event,
  kind,
  onBackToNext,
}: {
  event: Event;
  kind: FeaturedKind;
  onBackToNext?: () => void;
}) {
  const parts = eventDateParts(event.date);
  const date = `${parts.weekday} ${parts.month} ${parts.day}`;
  const kickers: Record<FeaturedKind, string> = {
    next: `Next meetup · ${date}`,
    upcoming: date,
    past: `Past · ${date}`,
  };

  return (
    <EventCard
      variant="featured"
      kicker={kickers[kind]}
      month={parts.month}
      day={parts.day}
      title={event.title}
      location={event.location}
      meta={kind === 'past' ? undefined : event.meta}
      rsvpHref={kind === 'next' ? event.rsvpHref : undefined}
    >
      {event.agenda && <Agenda items={event.agenda} />}
      {onBackToNext && (
        <Button variant="text" onClick={onBackToNext}>
          ← Back to next meetup
        </Button>
      )}
    </EventCard>
  );
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function EventsScreen() {
  const { events, status, now } = useEvents();
  const next = selectNext(events, now);
  const upcoming = selectUpcoming(events, now);
  const past = selectPast(events, now);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const featured = events.find((e) => e.id === selectedId) ?? next;
  const kindOf = (e: Event): FeaturedKind =>
    e === next ? 'next' : past.includes(e) ? 'past' : 'upcoming';
  const backToNext = () => {
    setSelectedId(null);
  };

  // On phones the card sits above the list. 'nearest' skips the scroll when it's already on screen.
  const featuredRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedId === null) return;
    featuredRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, [selectedId]);

  const rowProps = (e: Event) => ({
    selected: e.id === selectedId,
    onSelect: () => {
      setSelectedId(e.id);
    },
  });

  return (
    <div>
      <header style={{ padding: '48px 0 0' }}>
        <PageHeading
          kicker="Events"
          title={
            <>
              What's coming up
              <Period />
            </>
          }
        />
      </header>

      {(status === 'loading' || status === 'error') && (
        <section style={{ padding: '44px 0 8px' }}>
          <EventsStatus status={status} />
        </section>
      )}

      <section className="grid-events" style={{ padding: '44px 0 8px' }}>
        {featured && (
          // Stacking every card in one cell keeps it at the tallest card's height, so the page doesn't jump.
          <div ref={featuredRef} style={{ display: 'grid', scrollMarginTop: 24 }}>
            {events.map((e) => (
              <div
                key={e.id}
                style={{ gridArea: '1 / 1', visibility: e === featured ? 'visible' : 'hidden' }}
              >
                <FeaturedEvent
                  event={e}
                  kind={kindOf(e)}
                  onBackToNext={next && e !== next ? backToNext : undefined}
                />
              </div>
            ))}
          </div>
        )}

        <div>
          {upcoming.length > 0 && (
            <>
              <Kicker muted>Upcoming</Kicker>
              <div style={{ marginTop: 12 }}>
                {upcoming.map((e) => (
                  <EventRow key={e.id} event={e} {...rowProps(e)} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section style={{ padding: '40px 0' }}>
          <h2 className="section-title" style={{ marginBottom: 18 }}>
            Past meetups
          </h2>
          {past.map((e) => (
            <EventRow key={e.id} event={e} past {...rowProps(e)} />
          ))}
        </section>
      )}
    </div>
  );
}
