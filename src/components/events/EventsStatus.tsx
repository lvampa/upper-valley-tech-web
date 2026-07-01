import { Kicker } from '@components/core/Kicker.tsx';
import { type Status } from '@lib/types.ts';

interface EventsStatusProps {
  status: Status;
}

/**
 * Shared loading/error status for the events-backed screens. Renders the
 * "Loading events…" Kicker while loading, the "Couldn't load events" line on
 * error, and nothing otherwise. Each screen supplies its own section wrapper.
 */
export function EventsStatus({ status }: EventsStatusProps) {
  if (status === 'loading') return <Kicker muted>Loading events…</Kicker>;
  if (status === 'error') {
    return (
      <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>
        Couldn't load events — try again shortly.
      </p>
    );
  }
  return null;
}
