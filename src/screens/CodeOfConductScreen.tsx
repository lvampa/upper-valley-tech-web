import { Card } from '@components/core/Card.tsx';
import { PageHeading, Period } from '@components/core/PageHeading.tsx';
import { CONTACT_EMAIL } from '@lib/constants.ts';

const rules = [
  {
    number: '01',
    heading: "Everyone's welcome",
    body: 'Students, hobbyists, career engineers, founders, the merely curious — regardless of background, identity, or experience level. Don\'t gatekeep who counts as "technical."',
  },
  {
    number: '02',
    heading: 'Be respectful',
    body: "Harassment, discrimination, and demeaning comments aren't tolerated — in talks, in conversation, or online. Assume good faith and give people room to learn out loud.",
  },
  {
    number: '03',
    heading: "It's not a sales floor",
    body: "Come to share what you're working on and meet people, not to pitch, recruit aggressively, or harvest the room. A quick \"we're hiring\" is fine; cornering people isn't.",
  },
  {
    number: '04',
    heading: 'Respect the space',
    body: "We're guests at every venue. Clean up after yourself, drink responsibly, and follow whatever house rules the host sets.",
  },
  {
    number: '05',
    heading: 'Listen to the organizers',
    body: "Organizers may ask anyone whose behavior is making the meetup unwelcoming to leave. We'd rather never need this rule.",
  },
];

export function CodeOfConductScreen() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <header style={{ padding: '48px 0 0' }}>
        <PageHeading
          kicker="Code of conduct"
          title={
            <>
              Be decent
              <Period />
            </>
          }
        />
        <p style={{ color: 'var(--ink-2)', fontSize: 17, marginTop: 16 }}>
          Upper Valley Tech is meant to be a welcoming place for anyone curious about building
          things. A few ground rules keep it that way.
        </p>
      </header>

      <section style={{ marginTop: 8 }}>
        {rules.map((r) => (
          <div
            key={r.number}
            style={{
              padding: '22px 0',
              borderTop: '1px solid var(--line)',
              display: 'grid',
              gridTemplateColumns: '36px 1fr',
              gap: 18,
              alignItems: 'start',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--coral)',
                letterSpacing: '0.1em',
                paddingTop: 3,
              }}
            >
              {r.number}
            </div>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 18,
                  letterSpacing: '-0.015em',
                  marginBottom: 6,
                }}
              >
                {r.heading}
              </h3>
              <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.6 }}>{r.body}</p>
            </div>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--line)' }} />
      </section>

      <Card padding="24px 26px" style={{ marginTop: 36 }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 18,
            marginBottom: 8,
          }}
        >
          Reporting
        </h3>
        <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.6 }}>
          If something or someone is making you uncomfortable, tell an organizer in person or email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link-coral">
            {CONTACT_EMAIL}
          </a>
          . Reports stay confidential, and we'll take them seriously.
        </p>
      </Card>
    </div>
  );
}
