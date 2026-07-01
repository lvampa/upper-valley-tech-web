import { type ReactNode } from 'react';
import { Nav } from '@components/navigation/Nav.tsx';
import { Footer } from '@components/navigation/Footer.tsx';

interface ShellProps {
  active?: string;
  children: ReactNode;
}

export function Shell({ active, children }: ShellProps) {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Nav active={active} />
      <main
        className="page-gutter"
        style={{
          width: '100%',
          maxWidth: 'var(--nav-max)',
          margin: '0 auto',
          flex: 1,
          paddingBottom: 72,
        }}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
