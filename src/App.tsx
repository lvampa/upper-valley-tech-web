import { type EventsSnapshot } from '@lib/types.ts';
import { Shell } from './Shell.tsx';
import { resolveRoute } from '@lib/router.tsx';
import { EventsDataProvider } from '@lib/EventsDataContext.tsx';

interface AppProps {
  /** SSR passes the route being rendered; the client omits it and reads window. */
  location?: string;
  /** SSR/hydration snapshot of the events list (null on cold client render). */
  snapshot?: EventsSnapshot | null;
}

export function App({ location, snapshot = null }: AppProps) {
  const pathname = location ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const { Screen, active } = resolveRoute(pathname);

  return (
    <EventsDataProvider value={snapshot}>
      <Shell active={active}>
        <Screen />
      </Shell>
    </EventsDataProvider>
  );
}
