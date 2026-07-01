import { PageHeading, Period } from '@components/core/PageHeading.tsx';

export function NotFoundScreen() {
  return (
    <section style={{ padding: '56px 0' }}>
      <PageHeading kicker="404" title={<>Page not found<Period /></>} />
      <p style={{ color: 'var(--ink-2)', marginTop: 16 }}>
        That page doesn’t exist.{' '}
        <a href="/" style={{ color: 'var(--coral)' }}>
          Back to home
        </a>
        .
      </p>
    </section>
  );
}
