import { EventCard } from '@components/events/EventCard.tsx';
import { EventRow } from '@components/events/EventRow.tsx';
import { EventsStatus } from '@components/events/EventsStatus.tsx';
import { Kicker } from '@components/core/Kicker.tsx';
import { EmailCapture } from '@components/core/EmailCapture.tsx';
import { Button } from '@components/core/Button.tsx';
import { SectionLabel } from '@components/core/SectionLabel.tsx';
import { selectNext, selectUpcoming, eventDateParts } from '@data/events.ts';
import { useEvents } from '@lib/useEvents.ts';
import { useHCaptchaSubscribe } from '@lib/useHCaptchaSubscribe.ts';
import { CAPTCHA_KEY } from '@lib/constants.ts';

function SubscribeSection() {
  const { status, captchaRef, handleSubmit } = useHCaptchaSubscribe();
  return (
    <section id="subscribe" style={{ maxWidth: 520, margin: '72px auto 0', scrollMarginTop: 40 }}>
      <SectionLabel>
        <Kicker muted>Sign up for updates</Kicker>
      </SectionLabel>
      <EmailCapture status={status} onSubmit={handleSubmit} maxWidth="none" />
      <div ref={captchaRef} data-sitekey={CAPTCHA_KEY} data-size="invisible" />
    </section>
  );
}

export function HomeScreen() {
  const { events, status } = useEvents();
  const next = selectNext(events);
  const upcoming = selectUpcoming(events).slice(0, 2);
  const nextParts = next ? eventDateParts(next.date) : null;

  return (
    <div>
      <section style={{ textAlign: 'center', padding: '56px 0 0' }}>
        <h1 className="home-title">
          Upper Valley <span style={{ color: 'var(--coral)' }}>Tech.</span>
        </h1>
        <p
          className="text-balance"
          style={{ color: 'var(--ink-2)', fontSize: 18, maxWidth: 500, margin: '18px auto 0' }}
        >
          Monthly meetup for tech-focused people in the Upper Valley.
        </p>
      </section>

      {(status === 'loading' || status === 'error') && (
        <section style={{ maxWidth: 520, margin: '52px auto 0' }}>
          <EventsStatus status={status} />
        </section>
      )}

      {next && nextParts && (
        <section style={{ maxWidth: 520, margin: '52px auto 0' }}>
          <SectionLabel
            action={
              <Button variant="text" href="#/events">
                See all events →
              </Button>
            }
          >
            <Kicker>Next meetup</Kicker>
          </SectionLabel>
          <EventCard
            variant="compact"
            month={nextParts.month}
            day={nextParts.day}
            weekday={nextParts.weekday}
            title={next.title}
            time={next.time}
            location={next.location}
            rsvpHref={next.rsvpHref}
            rsvpLabel="RSVP"
          />
        </section>
      )}

      {upcoming.length > 0 && (
        <section style={{ maxWidth: 520, margin: '56px auto 0' }}>
          <SectionLabel>
            <Kicker muted>Also coming up</Kicker>
          </SectionLabel>
          {upcoming.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </section>
      )}

      <SubscribeSection />
    </div>
  );
}
