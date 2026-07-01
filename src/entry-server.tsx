import { renderToString } from 'react-dom/server';
import { StrictMode } from 'react';
import { App } from './App.tsx';
import { type Event } from './lib/types.ts';
import { renderHeadTags } from './lib/seo.ts';

export function render(
  pathname: string,
  data: { events: Event[] },
): { appHtml: string; headHtml: string } {
  const appHtml = renderToString(
    <StrictMode>
      <App location={pathname} initialEvents={data.events} />
    </StrictMode>,
  );
  const headHtml = renderHeadTags(pathname, data.events);
  return { appHtml, headHtml };
}

export { SITE_ROUTES } from './lib/seo.ts';
export { serializeInitialData, buildSitemap, renderDocument } from './lib/prerender.ts';
