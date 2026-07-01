import { useState, type CSSProperties, type ReactNode, type ElementType } from 'react';

type CardElevation = 'sm' | 'card' | 'lg';

interface CardProps {
  as?: ElementType;
  padding?: number | string;
  hoverable?: boolean;
  elevation?: CardElevation;
  style?: CSSProperties;
  children?: ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export function Card({
  as: Tag = 'div',
  padding = 24,
  hoverable = false,
  elevation = 'card',
  style,
  children,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: CardProps) {
  const [hover, setHover] = useState(false);
  const baseShadow =
    elevation === 'lg'
      ? 'var(--shadow-lg)'
      : elevation === 'sm'
        ? 'var(--shadow-sm)'
        : 'var(--shadow-card)';
  const shadow = hoverable && hover ? 'var(--shadow-card-hover)' : baseShadow;

  return (
    <Tag
      onClick={onClick}
      onMouseEnter={() => {
        setHover(true);
        onMouseEnter?.();
      }}
      onMouseLeave={() => {
        setHover(false);
        onMouseLeave?.();
      }}
      style={{
        border: '1px solid var(--line-2)',
        background: 'var(--surface-card)',
        borderRadius: 'var(--r-lg)',
        boxShadow: shadow,
        transform: hoverable && hover ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow var(--dur-base) var(--ease), transform var(--dur-base) var(--ease)',
        padding,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
