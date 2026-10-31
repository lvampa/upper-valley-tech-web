import { useState, type CSSProperties, type ReactNode } from 'react';
import { Card } from '@components/core/Card.tsx';
import { Button } from '@components/core/Button.tsx';
import { Kicker } from '@components/core/Kicker.tsx';

type EventCardVariant = 'compact' | 'featured' | 'row';

const Icon = {
  pin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22s-7-7.58-7-12a7 7 0 1 1 14 0c0 4.42-7 12-7 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

interface EventCardProps {
  variant?: EventCardVariant;
  month?: string;
  day?: string;
  weekday?: string;
  title?: string;
  location?: string;
  time?: string;
  kicker?: string;
  meta?: string[];
  onSelect?: () => void;
  selected?: boolean;
  past?: boolean;
  rsvpHref?: string;
  rsvpLabel?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

export function EventCard({
  variant = 'compact',
  month,
  day,
  weekday,
  title,
  location,
  time,
  kicker,
  meta = [],
  onSelect,
  selected = false,
  past = false,
  rsvpHref,
  rsvpLabel,
  children,
  style,
}: EventCardProps) {
  const [hover, setHover] = useState(false);

  // RSVP is an external link (e.g. a Luma event page), shown only when the
  // event has an rsvpHref. Opens in a new tab.
  const rsvpButton = rsvpHref ? (
    <Button variant="primary" href={rsvpHref} target="_blank" rel="noopener noreferrer">
      {rsvpLabel ?? 'RSVP'}
    </Button>
  ) : null;

  if (variant === 'row') {
    const primaryInk = past ? 'var(--ink-2)' : 'var(--ink)';
    const rowStyle: CSSProperties = {
      display: 'grid',
      gridTemplateColumns: '96px 1fr 90px',
      gap: 18,
      alignItems: 'center',
      padding: '16px 4px',
      borderTop: '1px solid var(--line)',
      color: 'var(--ink-2)',
      fontSize: 14,
      ...style,
    };
    const cells = (
      <>
        <div style={{ fontFamily: 'var(--font-mono)', color: primaryInk, fontSize: 13 }}>{day}</div>
        <div>
          <div style={{ color: primaryInk, fontFamily: 'var(--font-display)', fontWeight: 500 }}>
            {title}
          </div>
          {location ? (
            <div style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 2 }}>{location}</div>
          ) : null}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-3)' }}>
          {time}
        </div>
      </>
    );

    if (!onSelect) return <div style={rowStyle}>{cells}</div>;

    // Shading stays at or below 6% so the muted text keeps 4.5:1 contrast.
    const shade = selected ? 0.06 : hover ? 0.04 : 0;
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        onMouseEnter={() => {
          setHover(true);
        }}
        onMouseLeave={() => {
          setHover(false);
        }}
        style={{
          // The border reset comes first, or the shorthand wipes the row's border-top.
          border: 'none',
          fontFamily: 'inherit',
          fontWeight: 'inherit',
          lineHeight: 'inherit',
          ...rowStyle,
          width: '100%',
          background: shade ? `rgba(244, 241, 236, ${String(shade)})` : 'transparent',
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'background var(--dur-base) var(--ease)',
        }}
      >
        {cells}
      </button>
    );
  }

  if (variant === 'featured') {
    return (
      <Card padding={28} style={style}>
        {kicker ? <Kicker>{kicker}</Kicker> : null}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '14px 0 18px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}
          >
            {day}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 500,
              color: 'var(--ink-2)',
            }}
          >
            {month}
          </span>
        </div>
        <h3 className="section-title" style={{ margin: '0 0 10px' }}>
          {title}
        </h3>
        <div
          style={{
            color: 'var(--ink-2)',
            fontSize: 14,
            marginBottom: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
          }}
        >
          {location ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {Icon.pin}
              <span>{location}</span>
            </div>
          ) : null}
          {meta.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {Icon.clock}
              <span>{m}</span>
            </div>
          ))}
        </div>
        {children}
        {rsvpButton ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{rsvpButton}</div>
        ) : null}
      </Card>
    );
  }

  return (
    <Card style={style}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '80px 1fr auto',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.14em',
              color: 'var(--ink-3)',
              textTransform: 'uppercase',
            }}
          >
            {month}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 600,
              lineHeight: 1,
              margin: '2px 0',
            }}
          >
            {day}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--coral)',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
            }}
          >
            {weekday}
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 17,
              margin: '0 0 4px',
            }}
          >
            {title}
          </div>
          <div style={{ color: 'var(--ink-2)', fontSize: 13 }}>
            {time}
            {time && location ? ' · ' : ''}
            {location}
          </div>
        </div>
        {rsvpButton}
      </div>
    </Card>
  );
}
