import { Kicker } from '@components/core/Kicker.tsx';
import { Card } from '@components/core/Card.tsx';
import { Avatar } from '@components/core/Avatar.tsx';
import { Button } from '@components/core/Button.tsx';
import { EmailCapture } from '@components/core/EmailCapture.tsx';
import { PageHeading, Period } from '@components/core/PageHeading.tsx';
import { useHCaptchaSubscribe } from '@lib/useHCaptchaSubscribe.ts';
import { CONTACT_EMAIL, CAPTCHA_KEY } from '@lib/constants.ts';

export function AboutScreen() {
  const { status, captchaRef, handleSubmit } = useHCaptchaSubscribe();
  return (
    <div>
      <header style={{ padding: '48px 0 40px' }}>
        <PageHeading
          kicker="About"
          title={
            <>
              What this is
              <Period />
            </>
          }
        />
      </header>

      <section style={{ maxWidth: 600 }}>
        <p style={{ color: 'var(--ink-2)', fontSize: 16, marginTop: 16 }}>
          <span style={{ color: 'var(--ink)' }}>
            Upper Valley Tech is a monthly meetup for the people building software around the
            Connecticut River valley.
          </span>{' '}
          Lebanon, Hanover, White River Junction, and everywhere in between.
        </p>
        <p style={{ color: 'var(--ink-2)', fontSize: 16, marginTop: 16 }}>
          It started in 2025 as a simple idea: there are a lot of developers, founders, and
          tinkerers up here, but no easy way to find each other. So we get a room, line up a handful
          of five-minute talks, order pizza, and hang out. That's the whole thing.
        </p>
        <p style={{ color: 'var(--ink-2)', fontSize: 16, marginTop: 16 }}>
          No tracks, no badges, no sponsor pitches. Just show up.
        </p>
      </section>

      <section className="grid-2col" style={{ marginTop: 40 }}>
        <Card>
          <Kicker muted>Who runs it</Kicker>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
            <Avatar initials="CA" />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>
                Connor Abdelnoor
              </div>
              <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Organizer · founded 2025</div>
            </div>
          </div>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.55, marginTop: 16 }}>
            Software engineer in Lebanon. Started the meetup after one too many "we should all get
            together sometime" conversations.
          </p>
        </Card>

        <Card>
          <h3 className="card-title" style={{ marginBottom: 8, letterSpacing: '-0.01em' }}>
            Get involved
          </h3>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.55 }}>
            A few ways in: come to a meetup, give a five-minute talk, or help line up a venue.
            First-time speakers are the whole point — you don't need to be an expert.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            <Button variant="text" href="#/events">
              → See upcoming events
            </Button>
            <Button variant="text" href="#/about">
              → Pitch a talk
            </Button>
            <Button variant="text" href="#/code-of-conduct">
              → Read the code of conduct
            </Button>
          </div>
        </Card>
      </section>

      <Card padding={28} style={{ marginTop: 32 }}>
        <Kicker>Contact</Kicker>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 20,
            margin: '12px 0 8px',
          }}
        >
          Get in touch
        </h3>
        <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.55, maxWidth: 460 }}>
          Questions, talk pitches, or want to host a future meetup? Drop your email and a note, or
          reach out directly at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link-coral">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <div style={{ marginTop: 16 }}>
          <EmailCapture buttonLabel="Send" status={status} onSubmit={handleSubmit} maxWidth={420} />
          <div ref={captchaRef} data-sitekey={CAPTCHA_KEY} data-size="invisible" />
        </div>
      </Card>
    </div>
  );
}
