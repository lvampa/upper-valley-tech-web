import { type CSSProperties } from 'react';
import { Logo } from '@components/brand/Logo.tsx';

interface NavLink {
  label: string;
  href: string;
}
interface NavCta {
  label: string;
  href: string;
}

interface NavProps {
  links?: NavLink[];
  active?: string;
  cta?: NavCta | null;
  logoHref?: string;
  style?: CSSProperties;
}

export function Nav({
  links = [
    { label: 'Events', href: '#/events' },
    { label: 'About', href: '#/about' },
  ],
  active,
  cta = { label: 'Join mailing list', href: '#/#subscribe' },
  logoHref = '#/',
  style,
}: NavProps) {
  return (
    <nav
      className="nav-pad"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 'var(--nav-max)',
        margin: '0 auto',
        width: '100%',
        ...style,
      }}
    >
      <Logo size="sm" href={logoHref} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          fontSize: 14,
          color: 'var(--ink-2)',
        }}
      >
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            style={{
              color: active === l.href ? 'var(--ink)' : 'var(--ink-2)',
              textDecoration: 'none',
              transition: 'color var(--dur-base) var(--ease)',
            }}
          >
            {l.label}
          </a>
        ))}
        {cta ? (
          <a
            href={cta.href}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--r-sm)',
              background: 'rgba(244,241,236,0.08)',
              border: '1px solid var(--line-2)',
              color: 'var(--ink)',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            {cta.label}
          </a>
        ) : null}
      </div>
    </nav>
  );
}
