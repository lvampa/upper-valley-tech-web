// Post-build static prerender. Runs after the client + SSR Vite builds.
// Reads the client template (dist/index.html), fetches events once, renders
// every route to dist/<route>.html, and writes sitemap.xml. Cloudflare Pages
// serves <route>.html at /<route>, matching the canonical URLs; a
// <route>/index.html would be served at /<route>/ behind a redirect.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');

const server = await import(path.join(dist, 'server', 'entry-server.js'));
const { render, fetchEvents, SITE_ROUTES, serializeInitialData, buildSitemap, renderDocument } =
  server;

// Null, not [], on failure: an empty list would read as "no events" and hide
// the client's error state if its live fetch fails too.
async function loadEvents() {
  try {
    return await fetchEvents();
  } catch (err) {
    console.warn(`[prerender] events fetch failed (${String(err)}); baking no snapshot`);
    return null;
  }
}

function outPath(route) {
  return route === '/'
    ? path.join(dist, 'index.html')
    : path.join(dist, `${route.replace(/^\//, '')}.html`);
}

const template = await readFile(path.join(dist, 'index.html'), 'utf-8');
const builtAt = new Date();
const data = { events: await loadEvents(), asOf: builtAt.toISOString() };
const dataScript = serializeInitialData(data);

for (const route of SITE_ROUTES) {
  const { appHtml, headHtml } = render(route, data);
  const doc = renderDocument({ template, appHtml, headHtml, dataScript });
  const file = outPath(route);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, doc, 'utf-8');
  console.log(`[prerender] wrote ${path.relative(dist, file)}`);
}

// 404 page (Cloudflare Pages serves dist/404.html on unknown paths).
{
  const { appHtml, headHtml } = render('/404', data);
  await writeFile(
    path.join(dist, '404.html'),
    renderDocument({ template, appHtml, headHtml, dataScript }),
    'utf-8',
  );
  console.log('[prerender] wrote 404.html');
}

// Sitemap lastmod is the build date (ISO date only).
const lastmod = builtAt.toISOString().slice(0, 10);
await writeFile(path.join(dist, 'sitemap.xml'), buildSitemap(SITE_ROUTES, lastmod), 'utf-8');
console.log('[prerender] wrote sitemap.xml');

// Drop the SSR bundle so it is not uploaded to the CDN.
await rm(path.join(dist, 'server'), { recursive: true, force: true });
console.log('[prerender] done');
