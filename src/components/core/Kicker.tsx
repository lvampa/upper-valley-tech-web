import { type CSSProperties, type ReactNode, type ElementType } from 'react';

interface KickerProps {
  muted?: boolean;
  as?: ElementType;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Kicker({ muted = false, as: Tag = 'span', style, children }: KickerProps) {
  return (
    <Tag
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: muted ? 'var(--ink-3)' : 'var(--coral)',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
