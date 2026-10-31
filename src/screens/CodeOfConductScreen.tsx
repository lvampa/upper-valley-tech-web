import { Card } from '@components/core/Card.tsx';
import { PageHeading, Period } from '@components/core/PageHeading.tsx';
import { CONTACT_EMAIL } from '@lib/constants.ts';

const rules = [
  {
    number: '01',
    heading: "Everyone's welcome",
  },
  {
    number: '02',
    heading: "Don't be a dick",
  },
  {
    number: '03',
    heading: 'Respect the space',
  },
  {
    number: '04',
    heading: 'Listen to the organizers',
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
              A few ground rules
              <Period />
            </>
          }
        />
        <p style={{ color: 'var(--ink-2)', fontSize: 17, marginTop: 16 }}>
          Upper Valley Tech is meant to be a welcoming place for anyone curious about building
          things.
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
              alignItems: 'baseline',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--coral)',
                letterSpacing: '0.1em',
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
                }}
              >
                {r.heading}
              </h3>
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
          .
        </p>
      </Card>
    </div>
  );
}
