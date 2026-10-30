import { Kicker } from '@components/core/Kicker.tsx';
import { Card } from '@components/core/Card.tsx';
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
              What
              <Period />
            </>
          }
        />
      </header>

      <section style={{ maxWidth: 600 }}>
        <p style={{ color: 'var(--ink-2)', fontSize: 16, marginTop: 16 }}>
          <span style={{ color: 'var(--ink)' }}>
            Upper Valley Tech is a monthly meetup for people in the tech space who live in and
            around the Upper Valley.
          </span>{' '}
          Based out of Lebanon, NH, we welcome everyone to join us on a monthly basis.
        </p>
      </section>

      <section style={{ marginTop: 40 }}>
        <Card>
          <Kicker muted>Get involved</Kicker>
          <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.55, marginTop: 16 }}>
            A few ways in: come to a meetup, give a five-minute talk, or help line up a venue.
            First-time speakers are the whole point — you don't need to be an expert.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            <Button variant="text" href="/events">
              → See upcoming events
            </Button>
            <Button variant="text" href="/about">
              → Pitch a talk
            </Button>
            <Button variant="text" href="/code-of-conduct">
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
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>
            Connor Abdelnoor
          </div>
          <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Organizer · founded 2025</div>
        </div>
      </Card>
    </div>
  );
}
