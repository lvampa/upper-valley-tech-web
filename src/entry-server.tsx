import { renderToString } from 'react-dom/server';
import { StrictMode } from 'react';
import { App } from './App.tsx';
import { type EventsSnapshot } from './lib/types.ts';
import { renderHeadTags } from './lib/seo.ts';

export function render(
  pathname: string,
  snapshot: EventsSnapshot,
): { appHtml: string; headHtml: string } {
  const appHtml = renderToString(
    <StrictMode>
      <App location={pathname} snapshot={snapshot} />
    </StrictMode>,
  );
  const headHtml = renderHeadTags(pathname, snapshot.events ?? []);
  return { appHtml, headHtml };
}

export { SITE_ROUTES } from './lib/seo.ts';
export { fetchEvents } from './lib/api.ts';
export { serializeInitialData, buildSitemap, renderDocument } from './lib/prerender.ts';
