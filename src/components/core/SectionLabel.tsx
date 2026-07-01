import { type ReactNode, type CSSProperties } from 'react';

interface SectionLabelProps {
  children: ReactNode;
  action?: ReactNode;
  style?: CSSProperties;
}

export function SectionLabel({ children, action, style }: SectionLabelProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        ...style,
      }}
    >
      {children}
      {action ?? null}
    </div>
  );
}
