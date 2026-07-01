import { type CSSProperties } from 'react';

type LogoSize = 'sm' | 'md' | 'xl';

interface LogoProps {
  size?: LogoSize;
  wordmark?: boolean;
  href?: string;
  style?: CSSProperties;
  className?: string;
}

const SIZES = {
  sm: { box: 26, radius: 8, glyph: 14, font: 15, shadow: '0 0 0 1px rgba(0,0,0,.4) inset' },
  md: { box: 36, radius: 10, glyph: 18, font: 22, shadow: 'var(--shadow-mark-sm)' },
  xl: { box: 96, radius: 26, glyph: 48, font: 0, shadow: 'var(--shadow-mark)' },
};

function Glyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M1 13 L5 6 L8 10 L11 4 L15 13"
        stroke="var(--on-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ size = 'md', wordmark = true, href, style, className }: LogoProps) {
  const s = SIZES[size];
  const showWord = wordmark && size !== 'xl';
  const Tag = href ? 'a' : 'span';

  return (
    <Tag
      href={href}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? 10 : 12,
        textDecoration: 'none',
        color: 'var(--ink)',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: s.font,
        letterSpacing: '-0.015em',
        ...style,
      }}
    >
      <span
        style={{
          width: s.box,
          height: s.box,
          borderRadius: s.radius,
          background: 'var(--grad-brand)',
          display: 'grid',
          placeItems: 'center',
          boxShadow: s.shadow,
          flexShrink: 0,
        }}
      >
        <Glyph size={s.glyph} />
      </span>
      {showWord ? <span>Upper Valley Tech</span> : null}
    </Tag>
  );
}
