import { type CSSProperties } from 'react';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  tagline?: string;
  links?: FooterLink[];
  style?: CSSProperties;
}

export function Footer({
  tagline = 'est. 2025 · Upper Valley, NH + VT',
  links = [
    { label: 'Code of conduct', href: '#/code-of-conduct' },
    { label: 'Contact', href: '#/about' },
  ],
  style,
}: FooterProps) {
  return (
    <footer style={{ borderTop: '1px solid var(--line)', ...style }}>
      <div
        className="nav-pad"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
          maxWidth: 'var(--nav-max)',
          margin: '0 auto',
          width: '100%',
          paddingTop: 28,
          paddingBottom: 28,
          color: 'var(--ink-3)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div>{tagline}</div>
        <div style={{ display: 'flex', gap: 18 }}>
          {links.map((l) => (
            <a key={l.href} href={l.href} style={{ color: 'var(--ink-2)', textDecoration: 'none' }}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
