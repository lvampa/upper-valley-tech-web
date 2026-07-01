import { type CSSProperties } from 'react';

interface AvatarProps {
  initials?: string;
  src?: string;
  alt?: string;
  size?: number;
  style?: CSSProperties;
}

export function Avatar({ initials, src, alt = '', size = 48, style }: AvatarProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: src ? 'var(--paper-3)' : 'var(--grad-brand)',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        color: 'var(--on-accent)',
        fontSize: Math.round(size * 0.34),
        ...style,
      }}
    >
      {src ? (
        <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials
      )}
    </span>
  );
}
