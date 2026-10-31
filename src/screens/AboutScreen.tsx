import { Kicker } from '@components/core/Kicker.tsx';
import { Card } from '@components/core/Card.tsx';
import { EmailCapture } from '@components/core/EmailCapture.tsx';
import { InvisibleCaptcha } from '@components/core/InvisibleCaptcha.tsx';
import { PageHeading, Period } from '@components/core/PageHeading.tsx';
import { useHCaptchaSubscribe } from '@lib/useHCaptchaSubscribe.ts';
import { CONTACT_EMAIL } from '@lib/constants.ts';

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
        <p style={{ color: 'var(--ink)', fontSize: 16, marginTop: 16 }}>
          Upper Valley Tech is a monthly meetup for people in the tech space who live in and around
          the Upper Valley. Based out of Lebanon, NH, we welcome everyone to join us on a monthly
          basis.
        </p>
      </section>

      <Card padding={28} style={{ marginTop: 40 }}>
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
          Questions, talk pitches, or want to host a future meetup? Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link-coral">
            {CONTACT_EMAIL}
          </a>
          . To hear about upcoming meetups, leave your email below.
        </p>
        <div style={{ marginTop: 16 }}>
          <EmailCapture status={status} onSubmit={handleSubmit} maxWidth={420} />
          <InvisibleCaptcha ref={captchaRef} />
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
