import { type CSSProperties, type ReactNode } from 'react';

interface PillProps {
  dot?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Pill({ dot = true, style, children }: PillProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--ink-2)',
        padding: '6px 12px',
        borderRadius: 'var(--r-pill)',
        border: '1px solid var(--line-2)',
        background: 'rgba(255,255,255,0.03)',
        ...style,
      }}
    >
      {dot ? (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--coral)',
            boxShadow: '0 0 8px var(--coral)',
            flexShrink: 0,
          }}
        />
      ) : null}
      {children}
    </span>
  );
}
