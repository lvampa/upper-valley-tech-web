import { type ReactNode } from 'react';
import { Kicker } from './Kicker.tsx';

interface PageHeadingProps {
  kicker: string;
  title: ReactNode;
}

/**
 * The standard page header: a coral kicker above a display-font title.
 * Titles conventionally end in a coral period — pass it as
 * <PageHeading title={<>Be decent<Period /></>} /> or just include the span.
 */
export function PageHeading({ kicker, title }: PageHeadingProps) {
  return (
    <>
      <Kicker>{kicker}</Kicker>
      <h1 className="page-title">{title}</h1>
    </>
  );
}

/** The trailing coral full-stop used on page titles and headlines. */
export function Period() {
  return <span style={{ color: 'var(--coral)' }}>.</span>;
}
