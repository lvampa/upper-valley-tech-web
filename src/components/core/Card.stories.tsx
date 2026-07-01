import { Card } from './Card.tsx';
import { Kicker } from './Kicker.tsx';

export default { title: 'Core / Card' };

export const Default = () => (
  <Card style={{ maxWidth: 360 }}>
    <Kicker muted>01</Kicker>
    <h3
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 16,
        margin: '10px 0 6px',
      }}
    >
      Five quick talks
    </h3>
    <p style={{ color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
      Five-minute lightning talks on whatever someone's building, learning, or stuck on.
    </p>
  </Card>
);

export const Hoverable = () => (
  <Card hoverable style={{ maxWidth: 360 }}>
    <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: 0 }}>Hover me — I lift.</p>
  </Card>
);

export const Elevations = () => (
  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
    <Card elevation="sm" style={{ maxWidth: 200 }}>
      <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 13 }}>sm</p>
    </Card>
    <Card elevation="card" style={{ maxWidth: 200 }}>
      <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 13 }}>card (default)</p>
    </Card>
    <Card elevation="lg" style={{ maxWidth: 200 }}>
      <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 13 }}>lg</p>
    </Card>
  </div>
);
