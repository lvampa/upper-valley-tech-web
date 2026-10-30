import { EventCard } from '@components/events/EventCard.tsx';
import { EventRow } from '@components/events/EventRow.tsx';
import { EventsStatus } from '@components/events/EventsStatus.tsx';
import { Kicker } from '@components/core/Kicker.tsx';
import { PageHeading, Period } from '@components/core/PageHeading.tsx';
import { selectNext, selectUpcoming, selectPast, eventDateParts } from '@data/events.ts';
import { useEvents } from '@lib/useEvents.ts';
import { type AgendaItem } from '@lib/types.ts';

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
          <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {r.time}
          </span>
          <span style={{ color: r.open ? 'var(--ink-3)' : 'var(--ink-2)' }}>
            {r.speaker ? (
              <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{r.speaker} </b>
            ) : null}
            {r.description}
          </span>
        </div>
      ))}
    </div>
  );
}

export function EventsScreen() {
  const { events, status, now } = useEvents();
  const next = selectNext(events, now);
  const upcoming = selectUpcoming(events, now);
  const past = selectPast(events, now);
  const nextParts = next ? eventDateParts(next.date) : null;

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
        <p style={{ color: 'var(--ink-2)', fontSize: 17, marginTop: 16, maxWidth: 520 }}>
          Every meetup, past and future. We get together monthly across the Upper Valley — show up
          to any of them.
        </p>
      </header>

      {(status === 'loading' || status === 'error') && (
        <section style={{ padding: '44px 0 8px' }}>
          <EventsStatus status={status} />
        </section>
      )}

      <section className="grid-events" style={{ padding: '44px 0 8px' }}>
        {next && nextParts && (
          <EventCard
            variant="featured"
            kicker={`Next meetup · ${nextParts.weekday} ${nextParts.month} ${nextParts.day}`}
            month={nextParts.month}
            day={nextParts.day}
            title={next.title}
            location={next.location}
            meta={next.meta}
            rsvpHref={next.rsvpHref}
          >
            {next.agenda && <Agenda items={next.agenda} />}
          </EventCard>
        )}

        <div>
          {upcoming.length > 0 && (
            <>
              <Kicker muted>Upcoming</Kicker>
              <div style={{ marginTop: 12 }}>
                {upcoming.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section style={{ padding: '40px 0' }}>
          <h2 className="section-title" style={{ marginBottom: 4 }}>
            Past meetups
          </h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, marginBottom: 18 }}>
            Small but growing — the first one was eight people in a room.
          </p>
          {past.map((e) => (
            <EventRow key={e.id} event={e} past />
          ))}
        </section>
      )}
    </div>
  );
}
